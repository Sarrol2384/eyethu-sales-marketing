-- Track which agent should be credited for a lead (via their share link ?ref=<user_id>).

alter table public.leads
  add column if not exists attributed_agent_user_id uuid references auth.users (id) on delete set null;

create index if not exists leads_attributed_agent_user_id_idx
  on public.leads (attributed_agent_user_id);
