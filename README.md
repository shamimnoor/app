# Shamim Noor — Founder OS

A world-class AI-powered personal brand platform, agency website, CRM, community, blog, automation center and founder operating system — built on **React + Supabase + Vercel + n8n + OpenAI**.

> Designed for **Shamim Noor** · Business Systems Builder · Automation Architect · Agency Founder · Digital Solutions Consultant.

---

## Table of contents

1. [Stack at a glance](#stack-at-a-glance)
2. [Repository structure](#repository-structure)
3. [Prerequisites](#prerequisites)
4. [Step 1 — Set up Supabase](#step-1--set-up-supabase)
5. [Step 2 — Enable Google OAuth (optional)](#step-2--enable-google-oauth-optional)
6. [Step 3 — Configure n8n (Automation Center)](#step-3--configure-n8n-automation-center)
7. [Step 4 — Push the repo to GitHub](#step-4--push-the-repo-to-github)
8. [Step 5 — Deploy on Vercel](#step-5--deploy-on-vercel)
9. [Step 6 — First founder login](#step-6--first-founder-login)
10. [Local development](#local-development)
11. [Environment variables reference](#environment-variables-reference)
12. [Architecture notes](#architecture-notes)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap](#roadmap)

---

## Stack at a glance

| Layer | Tech |
|---|---|
| Frontend | React 19 + React Router 7 + Tailwind + shadcn/ui + Recharts + sonner |
| Database | **Supabase Postgres** (with Row-Level Security) |
| Auth | **Supabase Auth** — email/password + Google OAuth |
| Realtime | Supabase Realtime (messages, comments, community, likes) |
| AI Copilot | OpenAI GPT-5.2, streamed via a single **Vercel Edge Function** at `/api/copilot` |
| Automation | **n8n** (cloud or self-hosted) embedded as an iframe in the Founder Dashboard |
| Hosting | **Vercel** (one project hosts both the React SPA and the Edge Function) |

No always-on backend server. Everything runs serverless / managed.

---

## Repository structure

```
.
├── frontend/                      # The Vercel project root (set this in Vercel)
│   ├── api/
│   │   └── copilot.js             # Vercel Edge Function — streams AI replies
│   ├── public/
│   ├── src/
│   │   ├── components/            # UI + layout + widgets
│   │   ├── lib/
│   │   │   ├── supabase.js        # Supabase client
│   │   │   ├── auth.jsx           # React auth context
│   │   │   ├── db.js              # Supabase data access layer
│   │   │   ├── api.js             # axios-shape compat shim → calls db.js
│   │   │   └── theme.jsx          # Dark/light theme provider
│   │   ├── pages/                 # All public + dashboard pages
│   │   ├── App.js                 # Routes
│   │   ├── App.css
│   │   ├── index.css              # Tailwind + theme tokens
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json                # Vercel config (build + headers)
│   └── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql          # Schema + RLS + triggers + helpers
│   │   └── 0002_seed.sql          # Seed content (idempotent)
│   └── README.md
├── backend/                       # OPTIONAL — FastAPI shim for the Emergent preview only.
│   ├── server.py                  # Mirrors /api/copilot using OpenAI directly.
│   ├── requirements.txt
│   └── .env
├── .env.example                   # Master env-var reference
├── .gitignore
└── README.md
```

> **The `backend/` folder is NOT deployed to Vercel.** It only exists to keep the Emergent preview running while you develop locally. Vercel ignores anything outside `frontend/` when you set the **Root Directory** to `frontend`.

---

## Prerequisites

- A free **GitHub** account.
- A free **Supabase** project (https://supabase.com).
- A free **Vercel** account (https://vercel.com).
- An **OpenAI** API key (https://platform.openai.com/api-keys) with credits.
- Optional: an **n8n** instance (https://n8n.cloud or self-hosted).
- Node 18+ and Yarn 1.22+ for local dev.

---

## Step 1 — Set up Supabase

1. Create a project at https://supabase.com/dashboard. Note the **Project URL** and the **anon** + **service_role** keys (Settings → API).
2. Open the **SQL Editor**, click **New query**, paste the contents of `supabase/migrations/0001_init.sql`, and click **Run**. This creates every table, RLS policy, trigger and helper function.
3. Run a second query with the contents of `supabase/migrations/0002_seed.sql`. This inserts the seed services, solutions, industries, projects, case studies, blog posts and resources.
4. Go to **Authentication → Providers → Email** and **disable "Confirm email"** if you want instant signup (recommended for the first deploy — you can turn it back on later).
5. Go to **Authentication → URL Configuration**, set:
   - **Site URL** = `https://your-vercel-app.vercel.app` (or your custom domain)
   - **Redirect URLs**: add `https://your-vercel-app.vercel.app/auth/callback` and `https://your-vercel-app.vercel.app/reset-password`. For local dev also add `http://localhost:3000/auth/callback`.

> You can re-run the migrations any time — `0002_seed.sql` is idempotent, and `0001_init.sql` uses `IF NOT EXISTS` / `DROP POLICY IF EXISTS`. Safe.

---

## Step 2 — Enable Google OAuth (optional)

1. Go to https://console.cloud.google.com → create / select a project.
2. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://your-vercel-app.vercel.app` (and `http://localhost:3000` for dev)
   - **Authorized redirect URIs**: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client secret**.
4. In Supabase Dashboard → **Authentication → Providers → Google**: paste the Client ID + Secret and enable.
5. Done — the **"Continue with Google"** button on the Login/Register pages now works.

---

## Step 3 — Configure n8n (Automation Center)

The Founder Dashboard has an **Automation Center** tab that embeds your n8n editor as an iframe.

1. Spin up an n8n instance — quickest is https://n8n.cloud (free trial available). Self-host docs: https://docs.n8n.io/hosting/.
2. Make sure CORS / iframe embedding is allowed (n8n cloud allows this by default).
3. Set `REACT_APP_N8N_EMBED_URL` to the base URL of your n8n instance (e.g. `https://shamim-noor.app.n8n.cloud`).
4. (Optional, later) Use n8n's Webhook nodes to receive events from this app — wire your Supabase Database Webhooks or future serverless functions to `POST` to your n8n webhook URLs.

If you don't set `REACT_APP_N8N_EMBED_URL`, the Automation Center shows a polite "not configured yet" card.

---

## Step 4 — Push the repo to GitHub

```bash
cd /path/to/this/repo
git init
git add .
git commit -m "Shamim Noor Founder OS — initial commit"
gh repo create shamimnoor/founder-os --public --source=. --push
# or:
# git remote add origin git@github.com:youruser/your-repo.git
# git push -u origin main
```

`.gitignore` already excludes `.env`, `node_modules`, `_legacy_mongodb/` and friends, so no secrets are committed.

---

## Step 5 — Deploy on Vercel

1. Go to https://vercel.com/new and **Import** your GitHub repo.
2. **IMPORTANT**: set the **Root Directory** to `frontend`. (Click "Edit" next to "Root Directory" during the import step.)
3. Framework Preset: **Create React App** (auto-detected).
4. Add the following **Environment Variables** (Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `REACT_APP_SUPABASE_URL` | `https://<your-ref>.supabase.co` |
   | `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOi…` (the anon key) |
   | `REACT_APP_FOUNDER_EMAIL` | `abdullahmuhammadshamimreza@gmail.com` |
   | `REACT_APP_N8N_EMBED_URL` | `https://your-n8n.example.com` |
   | `REACT_APP_BACKEND_URL` | *(leave blank)* |
   | `OPENAI_API_KEY` | `sk-proj-…` (server-side only) |
   | `OPENAI_MODEL` | `gpt-5.2` (or `gpt-4o` as fallback) |

5. Click **Deploy**. First build takes 1–3 minutes. You'll get a `*.vercel.app` URL.
6. Back in Supabase: **Authentication → URL Configuration**, set **Site URL** to your new Vercel URL and add the redirect URLs again.

Done — the app is live. Future `git push` to `main` auto-deploys.

### Custom domain (optional)

In Vercel → Project → Settings → **Domains**, add `shamimnoor.dev` (or whatever). Vercel walks you through DNS via Entri or manual CNAME/A records. SSL is automatic. Update Supabase **Site URL** to the new domain afterwards.

---

## Step 6 — First founder login

1. Open the deployed site → **Register** → sign up with **`abdullahmuhammadshamimreza@gmail.com`** and any password (min 6 chars).
2. The Supabase `handle_new_user` trigger sees the founder email and assigns `role = 'founder'` automatically.
3. You're redirected to `/dashboard`. From there:
   - **Settings** — change password, update name + avatar + bio.
   - **CRM** — leads from Contact + Hire forms land here.
   - **Blog CMS** — create posts and drafts.
   - **Projects** — add portfolio items.
   - **Messages** — reply to user DMs (WhatsApp-style).
   - **Analytics** — 14-day visit/engagement chart, traffic sources pie.
   - **Automation Center** — embedded n8n editor.
   - **Command Center** — natural-language commands like "show leads" or "show analytics".

Regular visitors register with any other email and become normal `user` accounts.

---

## Local development

```bash
# Clone
git clone https://github.com/yourname/your-repo.git
cd your-repo

# Frontend
cd frontend
cp .env.example .env       # then fill in real values
yarn install
yarn start                 # http://localhost:3000

# Optional: FastAPI shim (only needed if your local /api/copilot doesn't go through Vercel)
cd ../backend
pip install -r requirements.txt
uvicorn server:app --port 8001
```

For local Vercel-like dev with the Edge Function active:

```bash
npm i -g vercel
cd frontend
vercel dev                 # runs frontend + /api/* functions on http://localhost:3000
```

---

## Environment variables reference

### Vercel project (client-side, prefixed `REACT_APP_`)

| Key | Purpose |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase project URL — exposed to browser |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key — safe to expose (RLS protects data) |
| `REACT_APP_FOUNDER_EMAIL` | Used to display founder-only UI hints |
| `REACT_APP_N8N_EMBED_URL` | URL for the Automation Center iframe |
| `REACT_APP_BACKEND_URL` | Blank on Vercel; set to preview URL in Emergent |

### Vercel project (server-side, used only by `/api/copilot.js`)

| Key | Purpose |
|---|---|
| `OPENAI_API_KEY` | Streaming AI Copilot |
| `OPENAI_MODEL` | Defaults to `gpt-5.2` |

### Local FastAPI shim (`backend/.env`)

Same OPENAI_* keys plus `CORS_ORIGINS=*`. The shim is **not** deployed to Vercel.

---

## Architecture notes

- **No long-running backend.** All reads/writes go straight from the browser to Supabase via `@supabase/supabase-js`. Row-Level Security enforces who can do what.
- **Founder authorisation** lives in the database. `is_founder()` is a SQL function that checks `profiles.role`. It's used inside every RLS policy that mutates founder-only tables.
- **The Vercel Edge Function** is the only piece of server code. It streams OpenAI responses via Server-Sent Events. Edge runtime works on Vercel Hobby — no streaming time-outs.
- **Realtime** is enabled on `messages`, `comments`, `community_posts`, `likes`. The frontend currently polls; you can swap to `supabase.channel(...)` for live updates whenever you want.
- **`api.js`** is a compatibility shim: it exposes an `axios`-shaped surface mapped onto the Supabase `db.js` layer. This means every existing page component compiles unchanged.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| AI Copilot shows "Copilot error: 429" | Your `OPENAI_API_KEY` is out of credits. Top up at https://platform.openai.com/billing. |
| Signup says "User already registered" | Email already used in Supabase Auth. Try `/forgot-password`. |
| Google button does nothing | Google provider not enabled in Supabase, or redirect URL not whitelisted. Re-check Step 2. |
| Founder dashboard redirects to home | Your account's `profiles.role` is `user`. In Supabase → Table Editor → `profiles` → set your row's `role` to `founder`. |
| Iframe blocked in Automation Center | Your n8n instance refuses framing. Allow it via `WEBHOOK_URL`/`N8N_HOST` env vars on n8n, or open in new tab from the button in the dashboard. |
| RLS error on insert | Make sure you're signed in. RLS denies anonymous writes everywhere except `leads` and `likes`. |

Logs:
- Vercel: https://vercel.com/&lt;your-username&gt;/&lt;your-project&gt;/logs
- Supabase: Dashboard → Logs

---

## Roadmap

Next iterations you may want to ship:

- Auto-distribute new blog posts to LinkedIn / X / Telegram via n8n webhooks (the trigger is ready — fire a Supabase Database Webhook on `blog_posts` insert with `status='published'` → POST to n8n).
- Stripe-checkout retainer plans on `/services`.
- Email digests via Resend triggered from `messages` insert.
- Supabase Storage for image uploads in Blog CMS (currently you paste image URLs).
- Calendly embed on `/hire` step 3 for instant-booking qualified leads.

---

Built with care for Shamim Noor.
