# Production baseline checklist

Complete this **before** shipping deferred phases (AI lead layer, crons, Cal.com). Tick items in your deploy runbook or PR template.

**Hosting on Vercel:** follow **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** (GitHub import, `NEXT_PUBLIC_SITE_URL`, env vars, redeploy).

## Supabase database

- [ ] All migrations applied **in filename order** on the **production** project (SQL Editor or `supabase db push`):

  1. [`20260512000001_init.sql`](../supabase/migrations/20260512000001_init.sql)
  2. [`20260514120000_agent_accounts_and_property_assignment.sql`](../supabase/migrations/20260514120000_agent_accounts_and_property_assignment.sql)
  3. [`20260515000000_agent_accounts_profile.sql`](../supabase/migrations/20260515000000_agent_accounts_profile.sql)
  4. [`20260515010000_property_sourcing_agent.sql`](../supabase/migrations/20260515010000_property_sourcing_agent.sql)
  5. [`20260515020000_lead_attributed_agent.sql`](../supabase/migrations/20260515020000_lead_attributed_agent.sql)
  6. [`20260516120000_agent_mandate_and_leads_scope.sql`](../supabase/migrations/20260516120000_agent_mandate_and_leads_scope.sql)  
     (This file includes idempotent `ADD COLUMN` for `sourced_by_user_id` / `attributed_agent_user_id` if earlier files were skipped.)

- [ ] **No** `service_role` key in client bundles or public env vars (server-only).

- [ ] Auth: admin vs agent behaviour tested against production RLS (listings, leads, `agent_accounts`).

Optional:

- [ ] [`seed.sql`](../supabase/seed.sql) **not** required for production (demo data only).

## Environment variables (hosting)

Copy from [`.env.local.example`](../.env.local.example). Minimum for a working public site + leads:

| Variable | Production expectation |
|----------|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role (Vercel **server** env only) |
| `NEXT_PUBLIC_SITE_URL` | **Canonical HTTPS URL** of the live site (no trailing slash). Used for share links, emails, OG canonicals — **not** `http://localhost:3000`. |
| `ANTHROPIC_API_KEY` | Required for admin AI listing copy |
| `BREVO_API_KEY` | Required for lead emails + contacts |
| `BREVO_SENDER_EMAIL` | Verified sender in Brevo |
| `BREVO_SENDER_NAME` | Display name (e.g. Eyethu Property Group) |
| `BREVO_SMS_SENDER` | Alphanumeric sender ID |
| `BREVO_SMS_ENABLED` | `false` until you accept SMS cost and behaviour |
| `SA_PRIME_RATE` | Current prime (default 11.75 if unset) |

Smoke tests after deploy:

- [ ] Public homepage and a **published** property load over HTTPS.
- [ ] Submit test lead on a listing → row in `leads`, agent/Brevo paths OK.
- [ ] Agent referral: open listing with `?ref=<agent_uuid>`, submit enquiry → `attributed_agent_user_id` set when ref is valid.

## Brevo

- [ ] Domain/sender verification completed for `BREVO_SENDER_EMAIL`.
- [ ] **API key IP restriction** disabled (or understood) for **Vercel serverless**: Brevo may block the first send from a new egress IP until you authorize it in the security alert email. For production, prefer turning off IP allowlisting on the key used by `BREVO_API_KEY` — Vercel IPs are not fixed like a single VPS.
- [ ] Transactional templates (if any) match what [`lib/brevo/`](../lib/brevo/) sends.
- [ ] With `BREVO_SMS_ENABLED=true`, trial SMS to a test agent number (cost awareness).
- [ ] One test enquiry from the live site → agent receives “New lead” email on the **first** submit (no second attempt required).

## Cal.com and crons (future phases)

- [ ] `CAL_COM_API_KEY` unset is OK until Cal.com phase — do not block launch.
- [ ] `CRON_SECRET` set before enabling any `/api/cron/*` route in production.

## References

- [SUPABASE_CLOUD_SETUP.md](./SUPABASE_CLOUD_SETUP.md) — local/cloud Supabase keys and first migration.
- [NEXT_PHASE_TRACK_AND_SCOPE.md](./NEXT_PHASE_TRACK_AND_SCOPE.md) — what to build after this baseline.
