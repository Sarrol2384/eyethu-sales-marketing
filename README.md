# Eyethu Property Group — sales & marketing site

Next.js 16 (App Router), Supabase, Tailwind v4, shadcn/ui. See **[PROJECT_PLAN.md](PROJECT_PLAN.md)** for scope and phases. Before go-live, use **[docs/PRODUCTION_BASELINE_CHECKLIST.md](docs/PRODUCTION_BASELINE_CHECKLIST.md)** and **[docs/NEXT_PHASE_TRACK_AND_SCOPE.md](docs/NEXT_PHASE_TRACK_AND_SCOPE.md)** for what to do first vs deferred work.

**Deploy to Vercel:** **[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)** (import GitHub repo, set env vars, push to deploy).

## Local development (Supabase Cloud, no Docker)

1. Follow **[docs/SUPABASE_CLOUD_SETUP.md](docs/SUPABASE_CLOUD_SETUP.md)** — create a supabase.com project, run `supabase/migrations/20260512000001_init.sql`, copy API keys.
2. Copy env and edit:

```bash
cp .env.local.example .env.local
```

3. Install and run:

```bash
npm install
npm run dev
```

If an admin page 404s in dev but works after `npm run build`, use `npm run dev:fresh` (clears `.next` and restarts).

This project uses **port 3010** so it does not share `localhost:3000` with other Eyethu repos (e.g. digital-cards). See **[docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)**.

- Site: [http://localhost:3010](http://localhost:3010)
- Admin: [http://localhost:3010/admin/login](http://localhost:3010/admin/login)
- Agent portal: [http://localhost:3010/agent/login](http://localhost:3010/agent/login)

Production: [https://eyethu-sales-marketing.vercel.app](https://eyethu-sales-marketing.vercel.app) (set `NEXT_PUBLIC_SITE_URL` to that URL on Vercel).

See **AGENTS.md** for stack and coding rules.

## Learn More (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
