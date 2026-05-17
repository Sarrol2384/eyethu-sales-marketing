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

- Site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

See **AGENTS.md** for stack and coding rules.

## Learn More (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
