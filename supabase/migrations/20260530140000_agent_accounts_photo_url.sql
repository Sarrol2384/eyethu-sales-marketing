-- One headshot per agent (roster), used on public listings via referral share links.

alter table public.agent_accounts
  add column if not exists photo_url text;
