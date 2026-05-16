-- Agent roster profile + admin RLS on agent_accounts.
--
-- If you never ran `20260514120000_agent_accounts_and_property_assignment.sql`,
-- the section below creates `agent_accounts`, `assigned_user_id`, and
-- `is_dashboard_admin()` so this script can run on a DB that only has
-- `20260512000001_init.sql`.
--
-- For correct scoped access on properties / leads / page_views (agents vs
-- admins), still run the full `20260514120000_agent_accounts_and_property_assignment.sql`
-- once — its statements are idempotent (drop policy if exists, etc.).

-- -----------------------------------------------------------------------------
-- Prerequisite: same as start of 20260514120000 (safe if already applied)
-- -----------------------------------------------------------------------------
create table if not exists public.agent_accounts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agent_accounts_user_id_idx on public.agent_accounts (user_id);

alter table public.properties
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

create index if not exists properties_assigned_user_id_idx on public.properties (assigned_user_id);

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

alter table public.agent_accounts enable row level security;

drop policy if exists "Users can read own agent row" on public.agent_accounts;
create policy "Users can read own agent row"
  on public.agent_accounts for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Profile columns (roster in /admin/agents)
-- -----------------------------------------------------------------------------
alter table public.agent_accounts
  add column if not exists display_name text,
  add column if not exists phone       text,
  add column if not exists email       text;

-- Admins (any authenticated user not in agent_accounts) can read and manage all rows.
drop policy if exists "Admins can manage agent_accounts" on public.agent_accounts;
create policy "Admins can manage agent_accounts"
  on public.agent_accounts for all
  to authenticated
  using (public.is_dashboard_admin())
  with check (public.is_dashboard_admin());
