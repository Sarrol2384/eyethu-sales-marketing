-- Ensure dashboard admins can read/manage the full agent roster.
-- Idempotent — safe if 20260515000000_agent_accounts_profile.sql already ran.

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

drop policy if exists "Admins can manage agent_accounts" on public.agent_accounts;
create policy "Admins can manage agent_accounts"
  on public.agent_accounts for all
  to authenticated
  using (public.is_dashboard_admin())
  with check (public.is_dashboard_admin());
