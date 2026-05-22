-- Dashboard admins may delete leads (POPIA: remove personal data on request).
-- Idempotent — requires public.is_dashboard_admin() from prior migrations.

drop policy if exists "Admins can delete leads" on public.leads;
create policy "Admins can delete leads"
  on public.leads for delete
  to authenticated
  using (public.is_dashboard_admin());
