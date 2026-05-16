-- Track which agent sourced / mandated the listing (separate from assigned manager).

alter table public.properties
  add column if not exists sourced_by_user_id uuid references auth.users (id) on delete set null;

create index if not exists properties_sourced_by_user_id_idx
  on public.properties (sourced_by_user_id);
