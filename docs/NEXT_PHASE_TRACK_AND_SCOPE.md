# Next phase track and scope

After [production baseline](./PRODUCTION_BASELINE_CHECKLIST.md) is green, implement **one** vertical at a time (per [PROJECT_PLAN.md](../PROJECT_PLAN.md) deferred work). For hosting, see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

## Chosen track (default recommendation)

**Phase 9 — Claude layer on leads** (highest CRM value without cron infrastructure).

Rationale: [lib/leads/score.ts](../lib/leads/score.ts) is rule-only today; [app/api/leads/route.ts](../app/api/leads/route.ts) stores `ai_summary` as `reasons.join(" · ")`. A short LLM narrative improves admin/agent triage before you invest in scheduled jobs or Cal.com.

### Scoped implementation (Phase 9)

1. **New server-only helper** (e.g. `lib/ai/lead-summary.ts`): call `@anthropic-ai/sdk` with a tight prompt: lead fields + rule reasons + property one-liner; return 2–4 sentences, ZA English, no PII in prompt beyond what the lead already sent.
2. **`POST /api/leads`**: after `scoreLead`, either:
   - await summary with a **timeout** (e.g. 8s) and on failure write rule-only summary; or
   - insert lead with rule summary first, then **async** update (more moving parts — prefer single request with fallback).
3. **Cost / abuse**: keep existing rate limit + honeypot; optional env `LEAD_AI_SUMMARY_ENABLED=false` to disable LLM in emergencies.
4. **Tests**: mock Anthropic in unit test or document manual smoke test.
5. **Do not** block HTTP 200 on Brevo/AI failure paths already used for side effects.

### Alternative track — Phases 9–11 crons

Scope when selected:

- Add `vercel.json` at the repo root with cron entries as sketched in [PROJECT_PLAN.md](../PROJECT_PLAN.md) (Automation section), each route checking `CRON_SECRET`.
- Implement `app/api/cron/follow-up`, `re-score`, `drip` with idempotency (e.g. `cron_runs` table or dedupe keys) and product copy in Brevo.
- See PROJECT_PLAN “Automation” section for intended behaviours (hot vs warm vs cold routing).

### Alternative track — Phase 10+ Cal.com

Scope when selected:

- Cal.com API v2: create/list availability, embed or link from property CTA.
- Map listing or agent to event type; handle webhooks or polling for booking status.
- Env: `CAL_COM_API_KEY` already listed in [`.env.local.example`](../.env.local.example).

---

## WhatsApp Business auto-leads — **deferred**

**Not** part of the numbered plan phases in-repo. Auto-creating `leads` rows from WhatsApp chat requires:

- Meta **WhatsApp Business Platform** (approved WABA, phone number, message templates for outbound).
- A **webhook** route (e.g. `POST /api/webhooks/whatsapp`) verifying Meta signatures, parsing inbound messages, deduping threads, POPIA/consent alignment for marketing vs transactional messages.
- Operational runbooks (template approval times, rate limits, failure alerts).

**Do this only after** production lead capture (form + Brevo + attribution) is stable and the baseline checklist is complete.

---

## Revision

When the business picks a different primary track, update the **Chosen track** section above and link the active epic or issue tracker.
