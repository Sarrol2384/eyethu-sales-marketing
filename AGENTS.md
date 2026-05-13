<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Eyethu PG — Project Coding Rules

Read [PROJECT_PLAN.md](PROJECT_PLAN.md) for full project context before implementing anything substantive.

## Stack non-negotiables

- **Next.js 16 App Router only** — no `pages/` directory, no `getServerSideProps`/`getStaticProps`
- **TypeScript strict** — no `any` unless justified; prefer `unknown` + narrowing
- **Server Components by default** — add `"use client"` only when you need state, effects, browser APIs, or event handlers
- **Tailwind CSS v4** — config lives in `app/globals.css` via `@theme`, NOT in `tailwind.config.js`
- **shadcn/ui** for components — radix-nova preset, neutral base, Lucide icons. Import from `@/components/ui/*`
- **Supabase** for db/auth/storage via `@supabase/ssr`. Server client = `@/lib/supabase/server`, browser client = `@/lib/supabase/browser`
- **Brevo** (`@getbrevo/brevo`) for email/SMS — NEVER Resend, SendGrid, or Twilio
- **Anthropic Claude** (`@anthropic-ai/sdk`) for AI — NEVER OpenAI

## South Africa rules (apply everywhere)

- Prices in **R 1 250 000** format (space thousand separator, leading `R `). Use `@/lib/format/currency` — never inline-format.
- Phone numbers in `+27 XX XXX XXXX` or `0XX XXX XXXX`. Use `@/lib/format/phone`.
- Property sizes in **m²** (not sqft).
- WhatsApp is the primary share/contact channel — WhatsApp button must be visually first and use `#25D366`.
- Lead forms must include a **POPIA consent** checkbox (required) and link to a privacy policy before submit.
- Mobile-first responsive design — test 375px viewport first, scale up.

## Code conventions

- File names: kebab-case for routes/files, PascalCase for components (`LeadForm.tsx`), camelCase for utils (`slugify.ts`)
- One component per file. Co-locate route-specific components under the route folder; reusable ones live in `components/`.
- Server Actions for mutations where possible; route handlers (`app/api/*/route.ts`) for public/webhook endpoints
- Validate ALL user input with **zod** at the API boundary
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Service-role client lives in server-only modules.
- Currency / phone / bond math goes in `lib/` — never duplicate formatting logic in components

## What NOT to do

- Do not hardcode the SA prime rate — read `SA_PRIME_RATE` env or DB setting (default 11.75)
- Do not write SQL in app code — schema changes go in `supabase/migrations/*.sql`
- Do not commit `.env.local` or any file with real keys
- Do not narrate code with obvious comments (`// fetch the user` above `await getUser()`)
- Do not add features outside the current phase without flagging it
