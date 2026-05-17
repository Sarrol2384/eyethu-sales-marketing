# Deploy to Vercel (Eyethu PG)

Vercel does **not** receive `git push` directly. You push to **GitHub**; Vercel **builds from GitHub** after you connect the repository once.

**Repository:** [github.com/Sarrol2384/eyethu-sales-marketing](https://github.com/Sarrol2384/eyethu-sales-marketing)

---

## 1. One-time: import the project

Complete these steps in the [Vercel dashboard](https://vercel.com/dashboard):

1. Click **Add New…** → **Project**.
2. **Import** `Sarrol2384/eyethu-sales-marketing`. If the repo is missing, use **Adjust GitHub App Permissions** or **Import Third-Party Git Repository** so Vercel can see it.
3. **Framework preset:** Next.js (auto-detected). **Root directory:** `.` (default).  
   A `vercel.json` file is not required for this Next.js app.
4. Click **Deploy** for the first build.  
   The first build may succeed with defaults or fail at runtime until **environment variables** (step 2) are set—add them next, then redeploy.

---

## 2. Environment variables (Production)

In the Vercel project: **Settings → Environment Variables**. Add each variable for **Production** (and **Preview** only if you use a separate preview database).

Copy names and meanings from [`.env.local.example`](../.env.local.example). Use **production** Supabase and Brevo values, not localhost.

| Variable | Production notes |
|----------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | Your live site URL: first `https://<project>.vercel.app`, later your **custom domain**. Must not be `http://localhost:3000`. Used for share links, emails, and OG URLs. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **Sensitive**; server-only. Enable for Production (and Preview only if needed). |
| `ANTHROPIC_API_KEY` | Required if admin AI listing generation runs in production |
| `BREVO_API_KEY` | Brevo v3 API key |
| `BREVO_SENDER_EMAIL` | Verified sender in Brevo |
| `BREVO_SENDER_NAME` | Display name (e.g. Eyethu Property Group) |
| `BREVO_SMS_SENDER` | Alphanumeric sender ID (max 11 chars) |
| `BREVO_SMS_ENABLED` | `false` until you accept SMS cost |
| `SA_PRIME_RATE` | Optional (default in app if unset) |
| `CAL_COM_API_KEY` | Optional until Cal.com phase |
| `CRON_SECRET` | Optional until cron routes exist |

After saving variables, trigger a new build: **Deployments** → open the latest deployment → **⋯** → **Redeploy** (check “Use existing Build Cache” off if you need a clean env read).

---

## 3. Ongoing deploys and verification

**Every deploy:** push to the branch connected to Production (usually `main`):

```bash
git push origin main
```

Vercel creates a new deployment automatically (unless you changed **Settings → Git → Production Branch**).

**Verify after deploy:**

- Open the **Production** URL; homepage and a published listing load over HTTPS.
- Submit a test **Enquiry** on a listing; confirm the row appears in Supabase `leads` and Brevo/email paths if configured.
- Optional: test `?ref=<agent_uuid>` then submit an enquiry and confirm `attributed_agent_user_id` in the database.

**Custom domain:** **Settings → Domains** → add your domain, update DNS as instructed, then set `NEXT_PUBLIC_SITE_URL` to that **https** URL and redeploy.

**Database:** Apply all Supabase migrations to production before relying on auth and RLS. See [PRODUCTION_BASELINE_CHECKLIST.md](./PRODUCTION_BASELINE_CHECKLIST.md).

---

## Optional: Vercel CLI

If you use the CLI (`npm i -g vercel`), you can link a folder with `vercel link` and deploy with `vercel --prod`. Env vars are still managed in the dashboard (or via `vercel env`). The GitHub integration above is enough for most teams.
