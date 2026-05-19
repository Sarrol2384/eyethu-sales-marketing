-- Agent default commission rate and per-listing commission overrides.

alter table public.agent_accounts
  add column if not exists default_commission_percent numeric(5,2)
    check (
      default_commission_percent is null
      or (
        default_commission_percent >= 0
        and default_commission_percent <= 100
      )
    );

alter table public.properties
  add column if not exists commission_percent numeric(5,2)
    check (
      commission_percent is null
      or (commission_percent >= 0 and commission_percent <= 100)
    ),
  add column if not exists commission_amount numeric(14,2)
    check (commission_amount is null or commission_amount >= 0),
  add column if not exists sold_price numeric(14,2)
    check (sold_price is null or sold_price >= 0);
