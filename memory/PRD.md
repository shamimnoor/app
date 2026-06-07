# Shamim Noor — Founder OS · PRD

## Stack (final, deployed-on-Vercel architecture)

- **Frontend**: React 19 + Tailwind + shadcn/ui (CRA, deploys to Vercel)
- **Database + Auth**: Supabase (Postgres + RLS + Auth + Realtime)
- **AI Copilot**: OpenAI GPT-5.2, streamed via a Vercel Edge Function (`/api/copilot`)
- **Automation**: n8n (cloud or self-hosted), embedded as iframe in dashboard
- **Hosting**: Vercel (single project: SPA + Edge function)
- **Legacy preview shim**: minimal FastAPI in `/backend/` that mirrors `/api/copilot` for the Emergent preview

## Repository layout

The repo is shaped for Vercel with **Root Directory = `frontend`**. The `backend/` folder is excluded from deployment.

## What's implemented

- All 18 public pages, Founder Dashboard with 9 tabs (Overview, CRM, Projects, Blog CMS, Messages, Analytics, Automation Center, Command Center, Settings)
- Auth: email/password + Google OAuth + forgot/reset password + email confirmation flow
- Founder identification via SQL trigger (`handle_new_user` auto-promotes founder email)
- Social engagement: likes, bookmarks, comments, shares, view counts — all backed by Supabase with RLS
- Direct user ↔ founder messaging via Supabase `messages` table
- AI Copilot streaming via Vercel Edge function (OpenAI direct)
- Settings page for profile + password change
- Automation Center page with n8n iframe + fallback "not configured" card
- Supabase SQL migrations (`0001_init.sql` schema + RLS, `0002_seed.sql` content) — idempotent
- Comprehensive README with step-by-step setup (Supabase, Google OAuth, n8n, GitHub push, Vercel deploy, custom domain)

## Next iterations

- Realtime subscriptions on messages/comments (infra is ready, currently polls)
- Supabase Storage for blog cover uploads
- Auto-distribute new published posts to LinkedIn/X/Telegram via n8n webhook (trigger via Supabase Database Webhook)
- Calendly embed on Hire step 3
- Stripe retainer checkout on `/services`
- Email digests via Resend on new lead/message

## Known issues / action items

- User's OpenAI API key currently returns 429 (quota exceeded). User needs to top up at https://platform.openai.com/billing.
- Supabase migrations not yet applied — user must run them via Dashboard SQL Editor (one-time).
- n8n embed URL not configured — Automation Center shows fallback until user sets `REACT_APP_N8N_EMBED_URL`.
