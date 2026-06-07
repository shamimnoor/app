# Shamim Noor — Founder OS Platform (PRD)

## Original problem statement
Build a world-class AI-powered personal brand platform, agency website, client management system, community platform, automation center, founder operating system, and AI control panel for Shamim Noor (Business Systems Builder, Automation Architect, Agency Founder, Digital Solutions Consultant). Combine the polish of Apple + Linear + Notion + Stripe + Vercel + HubSpot + Intercom + Slack.

## User personas
1. **Visitor / Prospect** — discovers Shamim's work, reads case studies, can like/share/bookmark, comment after sign-up, message Shamim, hire him.
2. **Community member** — registered user, can comment, bookmark, post in community, DM founder.
3. **Founder (Shamim)** — sees CRM, runs blog, manages projects, reads messages, sees analytics, runs natural-language commands.

## Architecture (v1)
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + Recharts + sonner + framer-motion-lite via CSS.
- Backend: FastAPI + Motor (MongoDB), JWT auth, bcrypt passwords.
- AI: GPT-5.2 via `emergentintegrations` Universal LLM key (streaming SSE).

## What's been implemented (Feb 2026)
- ✅ Custom JWT auth (register/login/me); founder email auto-promotes to admin role
- ✅ 12 public pages: Home, About, Services, Solutions, Industries, Projects, Project Detail, Case Studies, Case Study Detail, Blog, Blog Post, Resources, Contact, Hire (multi-step), Community, Login, Register, Messages, 404
- ✅ Social engagement system: likes (no login), bookmarks (login), comments (login), shares (Twitter/LinkedIn/Facebook/Telegram/WhatsApp/copy), view counts
- ✅ Direct messaging — user ↔ founder threads (WhatsApp-style)
- ✅ AI Copilot floating widget with streaming SSE responses (GPT-5.2)
- ✅ Founder Dashboard: Overview KPIs, CRM (status pipeline), Projects CMS, Blog CMS with drafts, Messages inbox, Analytics charts (Recharts), Command Center (natural-language → actions / LLM responses)
- ✅ MacOS-style command palette ⌘K (everywhere)
- ✅ Floating dock at bottom of dashboard
- ✅ Dark + light themes
- ✅ SEO/OG meta tags + favicon = founder photo
- ✅ Database seeded with services, solutions, industries, projects, case studies, blog posts, resources

## Prioritized backlog (P1)
- P1 Google social login (in addition to JWT) — currently only email/password
- P1 n8n workflow builder UI (deferred from MVP — currently descriptive only)
- P1 Auto distribution to LinkedIn / Twitter / Telegram on blog publish (requires API keys)
- P1 Object storage for image uploads in Blog CMS (currently URL-pasted)
- P1 SEO audit, structured data generator
- P2 Marketing pixel injector (Meta / GA / GTM / TikTok)
- P2 Email newsletter system with scheduled send
- P2 Calendly / scheduling embed on Hire flow
- P2 Stripe payment for retainers
- P2 Notifications + bookmark profile page

## Next tasks
- Run testing subagent to validate end-to-end flows.
- Address any P0 bugs surfaced by test.
- Phase 2: integrate Google OAuth + object storage + content distribution.
