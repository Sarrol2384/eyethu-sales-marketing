# Eyethu PG — AI Property Listing & Lead Generation Platform

## Overview

AI-powered property listing platform for **Eyethu Property Group**, a Cape Town real estate agency selling affordable homes — including (but not limited to) secure gated communities — across the Western Cape. Target market: first-time home buyers.

## Tech Stack

- **Next.js 16.2** (App Router, TypeScript strict, Turbopack dev) — note: spec said "14+", we landed on 16 because `create-next-app@latest` ships it. App Router APIs are forward-compatible.
- **React 19**
- **Tailwind CSS v4** (CSS-first config via `@theme` in `app/globals.css`)
- **shadcn/ui** (radix-nova preset, neutral base, Lucide icons)
- **Supabase** — database, auth, storage. **Cloud dev** against [supabase.com](https://supabase.com) is the default (no Docker); see `docs/SUPABASE_CLOUD_SETUP.md`. Optional local stack via Supabase CLI + Docker.
- **Claude API** (`@anthropic-ai/sdk`) — AI content generation + lead scoring summaries
- **Brevo** (`@getbrevo/brevo`) — transactional email, SMS, contacts
- **Cal.com API v2** — viewing bookings (phase 10+)
- **Vercel** — hosting + cron

## South Africa Rules (apply everywhere)

- **Currency:** South African Rand, formatted `R 1 250 000` (R + space + thin-spaced thousands)
- **Bond calculator default rate:** SA prime `11.75%` (stored as a setting/env var, not hardcoded — SA prime moves)
- **Bond affordability rule:** monthly bond payment ≤ 30% of gross household income
- **FLISP / First Home Finance subsidy:** first-time buyers earning R3,501–R22,000/month get R30k–R130k
- **Property sizes:** square metres (`m²`)
- **Phone format:** `+27 XX XXX XXXX` or `0XX XXX XXXX`
- **WhatsApp** is the #1 communication channel — always the primary share + contact CTA
- **POPIA consent:** lead form must have a consent checkbox + privacy policy link before submission
- **Mobile-first:** majority of users on smartphones (test 375px viewport)
- Support English copy as default. Afrikaans / isiXhosa support deferred (i18n hook points only)

## Pages

| Route | Purpose |
|---|---|
| `/` | Public homepage, property grid with filters |
| `/property/[slug]` | Auto-generated landing page per listing |
| `/admin/login` | Supabase Auth login |
| `/admin` | Analytics dashboard (protected) |
| `/admin/properties` | Manage listings (list / edit / delete / status toggle) |
| `/admin/properties/new` | Add new listing + AI content generation |
| `/admin/properties/[id]/edit` | Edit listing |
| `/admin/leads` | View and manage captured leads |

## Database Tables (Supabase PostgreSQL)

- **properties** — title, slug, status (draft/published/sold), property_type, listing_type, price, address, suburb, city, province, gated_community_name, **is_gated_community boolean**, bedrooms, bathrooms, garages, parking_spaces, floor_size_sqm, erf_size_sqm, year_built, features[], AI content fields (description, seo_title, seo_description, neighbourhood_summary, headline, cta), manual_description, agent info, published_at, timestamps
- **property_images** — property_id FK, image_url, alt_text, is_primary, display_order
- **leads** — property_id FK, full_name, phone, email, message, is_first_time_buyer, move_timeline, source, utm_*, lead_score, lead_category (hot/warm/cold), contacted, contacted_at, **consent_given_at** (POPIA)
- **page_views** — property_id FK, viewed_at, referrer, utm_*

## Brevo Integration

- `@getbrevo/brevo` package
- **Transactional email:** agent notification on new lead, lead confirmation
- **SMS:** alert agent for hot leads (gated by `BREVO_SMS_ENABLED` flag — costs per send)
- **Contacts:** add every consenting lead with custom attributes (`property_interest`, `suburb`, `budget`, `first_time_buyer`, `move_timeline`)

## Key Features Per Landing Page

- Hero image gallery (swipeable mobile via Embla, lightbox desktop)
- Price in `R 1 250 000` format + key details bar
- AI-generated property description
- Features grid with icons (lucide-react)
- **Bond repayment calculator** — sliders for deposit, rate (default SA prime), term (default 20 years); shows monthly payment, total interest, total repayment, minimum household income (30% rule), FLISP eligibility note
- AI-generated neighbourhood summary
- Lead capture form (name + phone required; email, message, first-time-buyer checkbox, move timeline dropdown, **POPIA consent**, honeypot field)
- Agent card with WhatsApp link (`wa.me/27...`)
- Share buttons — WhatsApp primary (`#25D366`), Facebook, copy link
- Full Open Graph meta for WhatsApp/Facebook previews
- Page view tracking (referrer + UTM)

## API Routes

- `POST /api/generate-content` — admin only, calls Claude, returns AI content
- `POST /api/leads` — public, validates (zod), honeypot, rate limit, saves, fires Brevo
- `POST /api/track-view` — public, fire-and-forget
- `GET  /api/properties` — public, filtered

## Spam / Abuse Protection

- Honeypot field (`hp_field`) on lead form — reject if filled
- In-memory IP rate limit on `/api/leads`: 5 req/min (Vercel-compatible; swap for Upstash Redis in prod)
- Captcha not used (mobile-hostile); rely on honeypot + rate limit + POPIA consent friction

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Eyethu Property Group
BREVO_SMS_SENDER=EyethuPG
BREVO_SMS_ENABLED=false
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CAL_COM_API_KEY=
SA_PRIME_RATE=11.75
CRON_SECRET=
```

## Automation (deferred to phases 9–11 — NOT in core build)

### Lead Processing Pipeline (`/api/leads`)
1. Save to Supabase
2. **Hybrid lead scoring:** rule-based first (BANT signals from form data), Claude only for the qualitative summary
3. Categorise: hot (75+), warm (40–74), cold (0–39)
4. Add/update Brevo contact with attributes
5. Route:
   - Hot: SMS + email to agent, offer Cal.com viewing slots to lead
   - Warm: email to agent, send matching properties to lead
   - Cold: thank-you email to lead, add to drip campaign

### Vercel Cron Jobs (`vercel.json`)
```json
{
  "crons": [
    { "path": "/api/cron/follow-up", "schedule": "0 8 * * *" },
    { "path": "/api/cron/re-score",  "schedule": "0 6 * * 1" },
    { "path": "/api/cron/drip",      "schedule": "0 9 * * 3" }
  ]
}
```
All cron routes guarded by `CRON_SECRET` Authorization header.

## Style / Brand

- **Primary:** deep teal-blue (Cape coastal feel, professional, trustworthy)
- **Accent:** warm coral for CTAs (warmth, urgency for "Enquire now")
- **WhatsApp green:** `#25D366` (reserved for WhatsApp buttons only)
- Large hero photos, clear CTAs, readable type
- WCAG AA contrast targets
