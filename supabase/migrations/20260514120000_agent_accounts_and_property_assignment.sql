-- Agent dashboard: assign listings to auth users; agents only see/edit their own.

-- -----------------------------------------------------------------------------
-- agent_accounts: users in this table use the /agent dashboard (scoped access).
-- Everyone else remains a full dashboard admin.
-- -----------------------------------------------------------------------------
create table if not exists public.agent_accounts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agent_accounts_user_id_idx on public.agent_accounts (user_id);

alter table public.properties
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

create index if not exists properties_assigned_user_id_idx on public.properties (assigned_user_id);

-- -----------------------------------------------------------------------------
-- RLS helper: admins = anyone not listed as an agent.
-- -----------------------------------------------------------------------------
create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.agent_accounts a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_dashboard_admin() from public;
grant execute on function public.is_dashboard_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- agent_accounts RLS (read own row only; manage via SQL editor / service role)
-- -----------------------------------------------------------------------------
alter table public.agent_accounts enable row level security;

drop policy if exists "Users can read own agent row" on public.agent_accounts;
create policy "Users can read own agent row"
  on public.agent_accounts for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- properties: replace broad authenticated policies with admin vs agent rules
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read published properties" on public.properties;
drop policy if exists "Authenticated can manage properties" on public.properties;

create policy "Anon can read published properties"
  on public.properties for select
  to anon
  using (status = 'published');

create policy "Authenticated can read scoped properties"
  on public.properties for select
  to authenticated
  using (
    status = 'published'
    or public.is_dashboard_admin()
    or assigned_user_id = auth.uid()
  );

create policy "Admins can insert properties"
  on public.properties for insert
  to authenticated
  with check (public.is_dashboard_admin());

create policy "Scoped users can update properties"
  on public.properties for update
  to authenticated
  using (
    public.is_dashboard_admin()
    or (assigned_user_id is not null and assigned_user_id = auth.uid())
  )
  with check (
    public.is_dashboard_admin()
    or (assigned_user_id is not null and assigned_user_id = auth.uid())
  );

create policy "Admins can delete properties"
  on public.properties for delete
  to authenticated
  using (public.is_dashboard_admin());

-- -----------------------------------------------------------------------------
-- property_images
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read images of published properties" on public.property_images;
drop policy if exists "Authenticated can manage images" on public.property_images;

create policy "Anon can read images of published listings"
  on public.property_images for select
  to anon
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and p.status = 'published'
    )
  );

create policy "Authenticated can read scoped property images"
  on public.property_images for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          p.status = 'published'
          or public.is_dashboard_admin()
          or p.assigned_user_id = auth.uid()
        )
    )
  );

create policy "Scoped users can insert property images"
  on public.property_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          public.is_dashboard_admin()
          or p.assigned_user_id = auth.uid()
        )
    )
  );

create policy "Scoped users can update property images"
  on public.property_images for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          public.is_dashboard_admin()
          or p.assigned_user_id = auth.uid()
        )
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          public.is_dashboard_admin()
          or p.assigned_user_id = auth.uid()
        )
    )
  );

create policy "Scoped users can delete property images"
  on public.property_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (
          public.is_dashboard_admin()
          or p.assigned_user_id = auth.uid()
        )
    )
  );

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read leads" on public.leads;
create policy "Authenticated can read scoped leads"
  on public.leads for select
  to authenticated
  using (
    public.is_dashboard_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and pr.assigned_user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can update leads" on public.leads;
create policy "Authenticated can update scoped leads"
  on public.leads for update
  to authenticated
  using (
    public.is_dashboard_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and pr.assigned_user_id = auth.uid()
    )
  )
  with check (
    public.is_dashboard_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and pr.assigned_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- page_views
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read page views" on public.page_views;
create policy "Authenticated can read scoped page views"
  on public.page_views for select
  to authenticated
  using (
    public.is_dashboard_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = page_views.property_id
        and pr.assigned_user_id = auth.uid()
    )
  );
