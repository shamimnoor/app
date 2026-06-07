# Shamim Noor — Founder OS · PRD

## Stack (final, deployed-on-Vercel architecture)

- **Frontend**: React 19 + Tailwind + shadcn/ui (CRA, deploys to Vercel)
- **Database + Auth**: Supabase (Postgres + RLS + Auth + Realtime)
- **AI Copilot**: OpenAI GPT-5.2, streamed via a Vercel Edge Function (`/api/copilot`)
- **AI Agent runner**: Vercel Edge Function (`/api/agent-run`) — non-streaming chat for agents + workflows
- **Automation**: n8n (cloud or self-hosted), embedded as iframe in dashboard
- **Hosting**: Vercel (single project: SPA + Edge functions)
- **Legacy preview shim**: minimal FastAPI in `/backend/` that mirrors `/api/copilot` for the Emergent preview

## Repository layout

The repo is shaped for Vercel with **Root Directory = `frontend`**. The `backend/` folder is excluded from deployment.

## What's implemented

### Phase 1–2 (V2 migration)
- All 18 public pages, Founder Dashboard with all tabs
- Auth: email/password + Google OAuth + forgot/reset password + email confirmation flow
- Founder identification via SQL trigger (`handle_new_user` auto-promotes `abdullahmuhammadshamimreza@gmail.com` to founder)
- Social engagement: likes, bookmarks, comments, shares, view counts — all backed by Supabase with RLS
- Direct user ↔ founder messaging via Supabase `messages` table
- AI Copilot streaming via Vercel Edge function (OpenAI direct)
- One-click `/setup` wizard that runs every SQL migration via the Supabase Management API
- `/dashboard/integrations` hub for n8n / OpenAI / GitHub / Vercel / Domain config — stored in DB, not env

### Phase 3 — AI Brain Layer ✅ (Feb 2026)
- New migration `0004_ai_layer.sql`:
  - `ai_memory` — persistent long-term memory (kind, content, tags, importance, GIN search)
  - `ai_knowledge` — RAG store with `search_knowledge()` RPC (Postgres full-text)
  - `ai_conversations` + `ai_messages` — threaded turn log
- New `/dashboard/ai-brain` page with Memory / Knowledge / Retrieval-test tabs
- `lib/aiBrain.js` helper: `buildContext()` mixes top memory + retrieved knowledge into any agent's system prompt

### Phase 4 — Agent Factory ✅ (Feb 2026)
- New migration `0005_agents.sql` seeding **18 specialised agents**: CEO, COO, CTO, CMO, CFO, CPO, CSO, CHRO, CDO, CIO, SDR, Customer Success, Designer, Copywriter, SEO Strategist, Researcher, Architect, Prompt Engineer
- `ai_agents` table (id, name, role_title, emoji, system_prompt, model, temperature, is_active)
- `/dashboard/agents` page — sidebar picker + test chat + edit prompt/model/temperature dialog
- `lib/agents.js` `runAgent()` calls `/api/agent-run` with full brain context

### Phase 5 — Multi-Agent Workflow Engine ✅ (Feb 2026)
- New migration `0006_workflows.sql`:
  - `ai_workflows` (slug, name, ordered steps as jsonb of `{agent_id, instructions}`)
  - `ai_workflow_runs` (status, steps_output history, conversation link)
  - Seeded 4 flagship chains: **Research → Architecture → Prompt**, **CEO → COO → CFO**, **CMO → Copywriter → SEO**, **CPO → Designer → Architect**
- `/dashboard/workflows` page — pick, run, see step-by-step output, persist runs
- Command Center upgraded: pick **single agent OR workflow**, run with one input, see streamed step output

## Database migrations (apply in order via `/setup` wizard)

1. `0001_init.sql` — schema, RLS, triggers
2. `0002_seed.sql` — services, solutions, industries, projects, case studies, blog posts
3. `0003_integrations.sql` — Integrations hub
4. `0004_ai_layer.sql` — Memory + Knowledge + Conversations
5. `0005_agents.sql` — 18 agents
6. `0006_workflows.sql` — Workflow engine + 4 seed chains

## Founder Email

`abdullahmuhammadshamimreza@gmail.com` (configured in `.env`, SQL trigger, and seed).

## Next / Backlog (P2)

- Media Library (Supabase Storage UI)
- Full Site CMS (page builder for nav/footer/header sections)
- Social Media Center & Auto-Distribution (n8n webhooks → LinkedIn/X/Telegram on blog publish)
- Marketing/SEO Center (Meta Pixel, GA, Search Console, UTM builder, dynamic sitemaps, robots.txt, schema generator)
- pgvector embeddings to upgrade `search_knowledge` from lexical → semantic RAG

## Known integration constraints

- `OPENAI_API_KEY` (env var) or **OpenAI** row in `integrations` table required for agents/copilot/workflows
- OpenAI 429 quota errors → user must add billing to their OpenAI account (not a code issue)
- n8n URL must be set via Integrations hub for the Automation Center embed
