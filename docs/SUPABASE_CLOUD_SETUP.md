# Supabase Cloud setup (no Docker)

Use this path when you develop and deploy against **[supabase.com](https://supabase.com)** only. You do **not** need Docker or `npx supabase start`.

For **production go-live** (migrations order, env, Brevo, `NEXT_PUBLIC_SITE_URL`), use **[PRODUCTION_BASELINE_CHECKLIST.md](./PRODUCTION_BASELINE_CHECKLIST.md)**.

## Step 1 — Create a project

1. Sign in at [supabase.com](https://supabase.com).
2. **New project** → name (e.g. `eyethu-pg`), pick a region (e.g. **South Africa** or **EU West**), set a database password, create.
3. Wait until the project is ready (~1–2 minutes).

## Step 2 — Run the database migration

1. In the Supabase dashboard, open **SQL Editor**.
2. In this repo, open [`supabase/migrations/20260512000001_init.sql`](../supabase/migrations/20260512000001_init.sql).
3. Copy the **entire** file, paste into the SQL Editor, click **Run**.
4. (Optional) Repeat with [`supabase/seed.sql`](../supabase/seed.sql) for a demo listing on the homepage.

If anything errors, check the message — avoid running the same migration twice if it already applied (some objects use `IF NOT EXISTS` / `on conflict`).

## Step 3 — Copy API keys

**Settings → API**

- **Project URL** — e.g. `https://xxxxxxxx.supabase.co`
- **anon** `public` key
- **service_role** key (secret — never expose in the browser or commit to git)

## Step 4 — Create `.env.local`

From the project root:

```powershell
copy .env.local.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key  
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key  
- `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000` (or your Vercel URL in production)

Other variables (`ANTHROPIC_API_KEY`, `BREVO_*`, etc.) can stay empty until you need AI generation or email.

## Step 5 — Create an admin user

**Authentication → Users → Add user**

- Email and password you want for `/admin/login`
- Enable **Auto Confirm User**

## Step 6 — Storage bucket

The migration creates the **`property-images`** bucket. If uploads fail, check **Storage** → confirm the bucket exists and is **public**.

## Step 7 — Run the app

```powershell
cd path\to\eyethu-sales-marketing
npm install
npm run dev
```

- Homepage: [http://localhost:3000](http://localhost:3000)  
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Vercel

Add the same variables under **Project → Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://yourdomain.co.za`).

## Reference

- Full project context: [PROJECT_PLAN.md](../PROJECT_PLAN.md)
