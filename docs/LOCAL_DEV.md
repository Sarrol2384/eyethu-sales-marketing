# Local development — ports and Eyethu repos

## Why this matters

Every Next.js app defaults to **http://localhost:3000** when you run `npm run dev`. Only **one** process can use port 3000 at a time on your machine.

If you work on several Eyethu folders (digital-cards, sales-marketing, reporting-agent, etc.), whichever dev server owns port 3000 is what **all** `localhost:3000` browser tabs show — even if Cursor has a different workspace open. That causes “wrong admin UI” confusion; it is not mixed git code.

## This project (eyethu-sales-marketing)

| Item | Value |
|------|--------|
| Dev command | `npm run dev` (runs on **port 3010**) |
| Public site | http://localhost:3010 |
| Admin login | http://localhost:3010/admin/login |
| Agent login | http://localhost:3010/agent/login |
| Env var | `NEXT_PUBLIC_SITE_URL=http://localhost:3010` in `.env.local` |

Agent admin URLs use **UUIDs**, e.g. `/admin/agents/3e166ef8-eb31-4472-9af7-10f3ce7508f5` — not name slugs like `lebohang-mokoena`.

## Production (always use the Vercel URL)

- https://eyethu-sales-marketing.vercel.app
- Admin: https://eyethu-sales-marketing.vercel.app/admin/login

Set `NEXT_PUBLIC_SITE_URL` on Vercel to your production HTTPS URL (not localhost).

## Other Eyethu repos

Keep **port 3000** (or pick another fixed port per repo) in each project’s `package.json`, e.g.:

```json
"dev": "next dev -p 3000"
```

Suggested habit:

| Project | Suggested port |
|---------|----------------|
| eyethu-digital-cards-cursor | 3000 |
| **eyethu-sales-marketing** | **3010** |
| eyethu-reporting-agent | 3011 |
| (others) | 3012+ |

## Check what is using a port (Windows PowerShell)

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
Get-Process -Id <PID>
```

Stop stray servers with **Ctrl+C** in the terminal where `next dev` is running.

## After switching projects

1. Read the **Local:** URL printed when `npm run dev` starts.
2. Hard refresh the browser (**Ctrl+F5**) or open a new tab with the correct port.

## Admin route shows 404 in dev (e.g. `/admin/agents`)

If the public “Page not found” screen appears on a URL that exists in the app (and `npm run build` lists the route), Turbopack’s cache is often stale.

1. Stop the dev server (**Ctrl+C**).
2. Run:

```bash
npm run dev:fresh
```

That deletes the `.next` folder and starts dev on port **3010** again.

3. Sign in first: http://localhost:3010/admin/login — protected admin URLs redirect to login when you are not signed in.

4. Then open http://localhost:3010/admin/agents (agent links use UUIDs, not name slugs).
