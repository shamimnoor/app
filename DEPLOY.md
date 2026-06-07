# DEPLOY — One-page hassle-free deployment

> Follow these 5 steps in order. Each takes 2–5 minutes. No SQL paste, no terminal.

---

## 1 · Push the repo to GitHub

In the chat input, tap **"Save to GitHub"** → pick / create a repo → push. (Or do it manually with `git push` if you prefer.)

---

## 2 · Create your Supabase project (free)

1. Go to https://supabase.com/dashboard → **New project** → choose a region close to you, pick any DB password (store it somewhere).
2. Wait ~2 min for provisioning.
3. Open **Settings → API**. Copy:
   - **Project URL** → looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** → starts with `eyJ…`

---

## 3 · Deploy to Vercel

1. Go to https://vercel.com/new → **Import** your GitHub repo.
2. **Root Directory**: set to `frontend` (important — the FastAPI shim must be excluded).
3. **Environment Variables** — add these four (you'll add OpenAI later if you don't have it now):

   | Key | Value |
   |---|---|
   | `REACT_APP_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` (from step 2) |
   | `REACT_APP_SUPABASE_ANON_KEY` | `eyJ…` (from step 2) |
   | `REACT_APP_FOUNDER_EMAIL` | `abdullahmuhammadshamimreza@gmail.com` |
   | `OPENAI_API_KEY` | `sk-proj-…` (optional — needed for AI agents/copilot) |

4. Hit **Deploy**. Vercel gives you a URL like `https://your-app.vercel.app`.

---

## 4 · Initialise the database — `/setup` wizard

1. Open `https://your-app.vercel.app/setup` in your browser.
2. Open https://supabase.com/dashboard/account/tokens → **Generate new token** → name it `founder-os-setup` → copy the `sbp_…` token.
3. Paste the token in the wizard → hit **Initialize database**.

The wizard runs all 6 migrations automatically in order:

| # | What it creates |
|---|---|
| `0001_init` | Schema, RLS policies, founder auth trigger, **auto-promotes any existing user with the founder email to `role = 'founder'`** |
| `0002_seed` | Services, solutions, industries, projects, case studies, blog posts |
| `0003_integrations` | Integrations Hub (n8n / OpenAI / GitHub / Vercel / domain) |
| `0004_ai_layer` | AI Brain — memory + knowledge + RAG + conversations |
| `0005_agents` | 18 specialised agents (CEO, COO, CTO, CMO, CFO, CPO, CSO, CHRO, CDO, CIO, SDR, CS, Designer, Copywriter, SEO, Researcher, Architect, Prompt Engineer) |
| `0006_workflows` | Multi-agent workflow engine + 4 seed chains (Research→Architecture→Prompt, CEO→COO→CFO, CMO→Copywriter→SEO, CPO→Designer→Architect) |

> All migrations are idempotent — re-running is safe and won't duplicate data.

---

## 5 · Sign in and tour your Founder OS

1. Click **Sign in** on the success page. Use:
   - Email: `abdullahmuhammadshamimreza@gmail.com`
   - Password: whatever you used at register
2. If you've never registered, click **Register** first.
3. You land on `/dashboard`. New tabs to try:
   - **AI Brain** (`/dashboard/ai-brain`) — add memories the agents should remember
   - **Agents** (`/dashboard/agents`) — chat with any of the 18 agents
   - **Workflows** (`/dashboard/workflows`) — run multi-agent chains
   - **Command Center** (`/dashboard/command`) — route any request to a single agent or workflow
   - **Integrations** (`/dashboard/integrations`) — store n8n / OpenAI / GitHub keys without `.env` edits

---

## Already registered before this update?

If you registered with `abdullahmuhammadshamimreza@gmail.com` **before** the founder email change rolled out:

- Re-running `/setup` is enough. Migration `0001_init` now contains a **one-shot promotion block** that detects your existing profile row and sets `role = 'founder'` automatically. No SQL paste needed.

---

## After deploy — optional but recommended

| Task | Where |
|---|---|
| Enable Google OAuth | Supabase Dashboard → Authentication → Providers → Google. Then in **Integrations Hub** toggle "Google OAuth" on. |
| Set custom domain | Vercel → Project → Domains → Add. Then update Supabase Auth → URL Configuration → Site URL. |
| Wire n8n | Spin up n8n at https://n8n.cloud → copy URL → paste in **Integrations Hub** (no `.env` edit). |
| Refill OpenAI quota | https://platform.openai.com/account/billing |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/dashboard` redirects to `/login` after sign-in | You're signed in but not the founder. Re-run `/setup` — migration 0001's promotion block handles it. |
| Setup wizard error: "token does not have access" | Generated the token while logged into a different Supabase account. Regenerate from the same account that owns the project. |
| Agent replies say "insufficient_quota" | OpenAI billing — refill at the link above. Code is fine. |
| Pages show empty data | Migrations not applied yet. Run `/setup`. |
| `/dashboard/ai-brain`, `/agents`, `/workflows` show nothing | Migrations `0004` / `0005` / `0006` not yet applied. Re-run `/setup`. |
