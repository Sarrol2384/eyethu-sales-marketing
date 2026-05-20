-- Reliable dashboard role detection for agents (bypasses RLS gaps on agent_accounts).
-- Idempotent — safe to re-run in Supabase SQL Editor.

create or replace function public.is_dashboard_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.agent_accounts a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_dashboard_agent() from public;
grant execute on function public.is_dashboard_agent() to authenticated;

-- Ensure agents can read their own roster row (profile, commission defaults).
drop policy if exists "Users can read own agent row" on public.agent_accounts;
create policy "Users can read own agent row"
  on public.agent_accounts for select
  to authenticated
  using (user_id = auth.uid());
