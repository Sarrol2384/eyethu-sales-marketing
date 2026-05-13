-- ============================================================================
-- Eyethu PG — initial schema
-- Tables: properties, property_images, leads, page_views
-- Enums:  property_status, property_type, listing_type, lead_category, move_timeline
-- ============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type property_status as enum ('draft', 'published', 'sold');
  end if;
  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type property_type as enum ('house', 'townhouse', 'apartment', 'land');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_type') then
    create type listing_type as enum ('sale', 'rent');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_category') then
    create type lead_category as enum ('hot', 'warm', 'cold');
  end if;
  if not exists (select 1 from pg_type where typname = 'move_timeline') then
    create type move_timeline as enum ('asap', '1_3_months', '3_6_months', '6_plus_months', 'just_browsing');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- properties
-- -----------------------------------------------------------------------------
create table if not exists public.properties (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  published_at                timestamptz,

  title                       text not null,
  slug                        text not null unique,
  status                      property_status not null default 'draft',

  property_type               property_type not null,
  listing_type                listing_type not null default 'sale',
  price                       numeric(14, 2) not null check (price >= 0),

  address                     text,
  suburb                      text not null,
  city                        text not null default 'Cape Town',
  province                    text not null default 'Western Cape',

  is_gated_community          boolean not null default false,
  gated_community_name        text,

  bedrooms                    int not null default 0 check (bedrooms >= 0),
  bathrooms                   int not null default 0 check (bathrooms >= 0),
  garages                     int not null default 0 check (garages >= 0),
  parking_spaces              int not null default 0 check (parking_spaces >= 0),
  floor_size_sqm              numeric(10, 2) check (floor_size_sqm is null or floor_size_sqm >= 0),
  erf_size_sqm                numeric(10, 2) check (erf_size_sqm is null or erf_size_sqm >= 0),
  year_built                  int check (year_built is null or (year_built between 1800 and 2100)),

  features                    text[] not null default '{}',

  manual_description          text,
  ai_description              text,
  ai_seo_title                text,
  ai_seo_description          text,
  ai_neighbourhood_summary    text,
  ai_headline                 text,
  ai_cta                      text,

  agent_name                  text,
  agent_phone                 text,
  agent_email                 text,
  agent_photo_url             text
);

create index if not exists properties_status_idx        on public.properties (status);
create index if not exists properties_suburb_idx        on public.properties (suburb);
create index if not exists properties_property_type_idx on public.properties (property_type);
create index if not exists properties_price_idx         on public.properties (price);
create index if not exists properties_published_at_idx on public.properties (published_at desc);

-- Auto-update updated_at + set published_at when status flips to published
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if (tg_op = 'UPDATE' and new.status = 'published' and old.status <> 'published' and new.published_at is null) then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- property_images
-- -----------------------------------------------------------------------------
create table if not exists public.property_images (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  image_url     text not null,
  alt_text      text,
  is_primary    boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists property_images_property_id_idx on public.property_images (property_id);
create unique index if not exists property_images_one_primary_per_property
  on public.property_images (property_id) where is_primary;

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  property_id           uuid references public.properties(id) on delete set null,

  full_name             text not null,
  phone                 text not null,
  email                 text,
  message               text,

  is_first_time_buyer   boolean not null default false,
  move_timeline         move_timeline,

  source                text,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,

  lead_score            int check (lead_score is null or (lead_score between 0 and 100)),
  lead_category         lead_category,
  ai_summary            text,

  contacted             boolean not null default false,
  contacted_at          timestamptz,

  -- POPIA compliance: must be a non-null timestamp when consent was given
  consent_given_at      timestamptz not null default now()
);

create index if not exists leads_property_id_idx   on public.leads (property_id);
create index if not exists leads_created_at_idx    on public.leads (created_at desc);
create index if not exists leads_lead_category_idx on public.leads (lead_category);
create index if not exists leads_contacted_idx     on public.leads (contacted);

-- -----------------------------------------------------------------------------
-- page_views
-- -----------------------------------------------------------------------------
create table if not exists public.page_views (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid references public.properties(id) on delete cascade,
  viewed_at    timestamptz not null default now(),
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text
);

create index if not exists page_views_property_id_idx on public.page_views (property_id);
create index if not exists page_views_viewed_at_idx   on public.page_views (viewed_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Model:
--   - Public (anon) can SELECT published properties + their images
--   - Public (anon) can INSERT leads + page_views (with checks)
--   - Authenticated users (admins) have full access
--   - Service role bypasses RLS (used by server-side admin routes)
-- ============================================================================

alter table public.properties      enable row level security;
alter table public.property_images enable row level security;
alter table public.leads           enable row level security;
alter table public.page_views      enable row level security;

-- properties
drop policy if exists "Public can read published properties" on public.properties;
create policy "Public can read published properties"
  on public.properties for select
  to anon, authenticated
  using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage properties" on public.properties;
create policy "Authenticated can manage properties"
  on public.properties for all
  to authenticated
  using (true) with check (true);

-- property_images: visible if parent property is visible
drop policy if exists "Public can read images of published properties" on public.property_images;
create policy "Public can read images of published properties"
  on public.property_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (p.status = 'published' or auth.role() = 'authenticated')
    )
  );

drop policy if exists "Authenticated can manage images" on public.property_images;
create policy "Authenticated can manage images"
  on public.property_images for all
  to authenticated
  using (true) with check (true);

-- leads: anon can INSERT (with consent + sane data), only authenticated can read
drop policy if exists "Public can submit leads" on public.leads;
create policy "Public can submit leads"
  on public.leads for insert
  to anon, authenticated
  with check (
    consent_given_at is not null
    and length(full_name) between 2 and 120
    and length(phone) between 6 and 20
  );

drop policy if exists "Authenticated can read leads" on public.leads;
create policy "Authenticated can read leads"
  on public.leads for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update leads" on public.leads;
create policy "Authenticated can update leads"
  on public.leads for update
  to authenticated
  using (true) with check (true);

-- page_views: anon can INSERT, only authenticated can read
drop policy if exists "Public can log page views" on public.page_views;
create policy "Public can log page views"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated can read page views" on public.page_views;
create policy "Authenticated can read page views"
  on public.page_views for select
  to authenticated
  using (true);

-- ============================================================================
-- Storage bucket for property images
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: public read, authenticated write
drop policy if exists "Public read property images" on storage.objects;
create policy "Public read property images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated upload property images" on storage.objects;
create policy "Authenticated upload property images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

drop policy if exists "Authenticated update property images" on storage.objects;
create policy "Authenticated update property images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images') with check (bucket_id = 'property-images');

drop policy if exists "Authenticated delete property images" on storage.objects;
create policy "Authenticated delete property images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images');
