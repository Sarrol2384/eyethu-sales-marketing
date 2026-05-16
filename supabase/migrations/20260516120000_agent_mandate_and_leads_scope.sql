-- Agents: listings they are assigned to OR sourced (mandated); leads for those
-- listings OR leads attributed to them via share link (?ref=).

-- Idempotent prerequisites (safe if 20260515010000 / 20260515020000 were skipped)
alter table public.properties
  add column if not exists sourced_by_user_id uuid references auth.users (id) on delete set null;

create index if not exists properties_sourced_by_user_id_idx
  on public.properties (sourced_by_user_id);

alter table public.leads
  add column if not exists attributed_agent_user_id uuid references auth.users (id) on delete set null;

create index if not exists leads_attributed_agent_user_id_idx
  on public.leads (attributed_agent_user_id);

-- -----------------------------------------------------------------------------
-- properties: read + update for sourcing agent
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read scoped properties" on public.properties;
create policy "Authenticated can read scoped properties"
  on public.properties for select
  to authenticated
  using (
    status = 'published'
    or public.is_dashboard_admin()
    or assigned_user_id = auth.uid()
    or sourced_by_user_id = auth.uid()
  );

drop policy if exists "Scoped users can update properties" on public.properties;
create policy "Scoped users can update properties"
  on public.properties for update
  to authenticated
  using (
    public.is_dashboard_admin()
    or (assigned_user_id is not null and assigned_user_id = auth.uid())
    or (sourced_by_user_id is not null and sourced_by_user_id = auth.uid())
  )
  with check (
    public.is_dashboard_admin()
    or (assigned_user_id is not null and assigned_user_id = auth.uid())
    or (sourced_by_user_id is not null and sourced_by_user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- property_images: mirror assigned + sourced + admin
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read scoped property images" on public.property_images;
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
          or p.sourced_by_user_id = auth.uid()
        )
    )
  );

drop policy if exists "Scoped users can insert property images" on public.property_images;
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
          or p.sourced_by_user_id = auth.uid()
        )
    )
  );

drop policy if exists "Scoped users can update property images" on public.property_images;
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
          or p.sourced_by_user_id = auth.uid()
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
          or p.sourced_by_user_id = auth.uid()
        )
    )
  );

drop policy if exists "Scoped users can delete property images" on public.property_images;
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
          or p.sourced_by_user_id = auth.uid()
        )
    )
  );

-- -----------------------------------------------------------------------------
-- leads: assigned or sourced listing, or attributed to this agent
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read scoped leads" on public.leads;
create policy "Authenticated can read scoped leads"
  on public.leads for select
  to authenticated
  using (
    public.is_dashboard_admin()
    or attributed_agent_user_id = auth.uid()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and (
          pr.assigned_user_id = auth.uid()
          or pr.sourced_by_user_id = auth.uid()
        )
    )
  );

drop policy if exists "Authenticated can update scoped leads" on public.leads;
create policy "Authenticated can update scoped leads"
  on public.leads for update
  to authenticated
  using (
    public.is_dashboard_admin()
    or attributed_agent_user_id = auth.uid()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and (
          pr.assigned_user_id = auth.uid()
          or pr.sourced_by_user_id = auth.uid()
        )
    )
  )
  with check (
    public.is_dashboard_admin()
    or attributed_agent_user_id = auth.uid()
    or exists (
      select 1 from public.properties pr
      where pr.id = leads.property_id
        and (
          pr.assigned_user_id = auth.uid()
          or pr.sourced_by_user_id = auth.uid()
        )
    )
  );

-- -----------------------------------------------------------------------------
-- page_views: assigned or sourced listing
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated can read scoped page views" on public.page_views;
create policy "Authenticated can read scoped page views"
  on public.page_views for select
  to authenticated
  using (
    public.is_dashboard_admin()
    or exists (
      select 1 from public.properties pr
      where pr.id = page_views.property_id
        and (
          pr.assigned_user_id = auth.uid()
          or pr.sourced_by_user_id = auth.uid()
        )
    )
  );
