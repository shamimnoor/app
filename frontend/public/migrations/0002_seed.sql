-- ============================================================================
-- Seed data for Shamim Noor
-- Apply AFTER 0001_init.sql
-- Safe to re-run (uses ON CONFLICT)
-- ============================================================================

-- Services --------------------------------------------------------------------
insert into public.services (id, title, icon, tagline, description, deliverables, starting_price, sort_order) values
('svc-business-systems', 'Business Systems Design', 'Workflow', 'Architect the operating system your business runs on.', 'End-to-end design of the systems, dashboards and SOPs that make your company scalable and predictable.', '["System map","SOP library","Dashboards","Hand-off training"]'::jsonb, 'from $4,800', 10),
('svc-automation', 'Automation Architecture', 'Bot', 'Replace busywork with elegant n8n + AI workflows.', 'We build automation pipelines that connect your CRM, marketing, billing and ops — fully owned by you.', '["Workflow blueprints","n8n flows","AI agents","Monitoring"]'::jsonb, 'from $2,400', 20),
('svc-client-portals', 'Client Portals & Dashboards', 'LayoutDashboard', 'Premium client experiences that win retention.', 'Beautiful, brandable portals so your clients self-serve, track delivery and feel taken care of.', '["Custom portal","Roles & auth","File hand-off","White-label"]'::jsonb, 'from $3,600', 30),
('svc-crm', 'CRM & Pipeline Engineering', 'Users', 'A CRM that actually fits how you sell.', 'Replace generic SaaS with a tailored CRM tuned to your funnel, pipeline and reporting needs.', '["Pipeline schema","Lead automations","Reports","Migration"]'::jsonb, 'from $2,800', 40),
('svc-ai-copilots', 'AI Copilots & Knowledge', 'Sparkles', 'Your private operator that knows your business.', 'Custom GPT copilots wired to your data — for sales, support, content and research.', '["Knowledge base","Copilot UX","Guardrails","Analytics"]'::jsonb, 'from $3,200', 50),
('svc-websites', 'Modern Web Experiences', 'Globe', 'Sites that feel like Apple, Linear and Stripe.', 'Premium marketing & product sites built for speed, SEO and conversion.', '["Design system","CMS","Analytics","SEO foundation"]'::jsonb, 'from $3,000', 60)
on conflict (id) do update set
  title = excluded.title, icon = excluded.icon, tagline = excluded.tagline,
  description = excluded.description, deliverables = excluded.deliverables,
  starting_price = excluded.starting_price, sort_order = excluded.sort_order;

-- Solutions -------------------------------------------------------------------
insert into public.solutions (id, title, summary, sort_order) values
('sol-agency-os', 'Agency Operating System', 'Unified CRM, project, content and finance system for boutique agencies.', 10),
('sol-client-portal', 'Client Portal Platform', 'White-label portal where clients track work, approve assets and chat.', 20),
('sol-content-engine', 'AI Content Engine', 'Pipeline that turns one idea into LinkedIn, X, YouTube and newsletter content.', 30),
('sol-sales-copilot', 'Sales Copilot', 'AI copilot that drafts proposals, replies to leads and forecasts revenue.', 40),
('sol-ops-automation', 'Ops Automation Stack', 'n8n + Zapier + custom services to remove repetitive operations work.', 50),
('sol-founder-os', 'Founder OS Dashboard', 'One unified dashboard for founders: people, money, projects, content.', 60)
on conflict (id) do update set title = excluded.title, summary = excluded.summary, sort_order = excluded.sort_order;

-- Industries ------------------------------------------------------------------
insert into public.industries (id, name, blurb, sort_order) values
('ind-saas', 'SaaS & Software', 'Onboarding, billing and lifecycle automation for product teams.', 10),
('ind-agency', 'Creative Agencies', 'Studio ops, client delivery and retainer management.', 20),
('ind-ecom', 'E-commerce', 'Post-purchase, support and merchandising automation.', 30),
('ind-finance', 'Finance & Fintech', 'Secure dashboards, compliance and reporting layers.', 40),
('ind-health', 'Healthcare', 'Patient intake, scheduling and HIPAA-friendly portals.', 50),
('ind-education', 'Education', 'Cohort tooling, student dashboards and AI tutoring.', 60),
('ind-realestate', 'Real Estate', 'Lead routing, CRM and listing automation.', 70),
('ind-creators', 'Creators & Founders', 'Personal brand systems, content engines and monetization.', 80)
on conflict (id) do update set name = excluded.name, blurb = excluded.blurb, sort_order = excluded.sort_order;

-- Projects --------------------------------------------------------------------
insert into public.projects (slug, title, summary, body, cover, tags, industry, client, status) values
('northwind-agency-os', 'Northwind Agency OS', 'Replaced 7 SaaS tools with one unified agency operating system.', 'We unified pipeline, projects, time tracking and invoicing into a single founder dashboard. Delivery cycles dropped 38% and team admin time fell by 12 hours per week.', 'https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?crop=entropy&cs=srgb&fm=jpg&q=85', array['agency','crm','automation'], 'Creative Agencies', 'Northwind Creative', 'published'),
('atlas-health-patient-portal', 'Atlas Health Patient Portal', 'HIPAA-friendly portal with secure messaging and intake automation.', 'Patient intake forms now auto-create CRM records, schedule visits and trigger reminders. Manual front-desk work was cut by 60%.', 'https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['healthcare','portal','automation'], 'Healthcare', 'Atlas Health', 'published'),
('lumen-saas-onboarding', 'Lumen SaaS Onboarding', 'AI-driven onboarding flow that lifted activation by 41%.', 'A conversational AI guide replaced a 14-step setup wizard. Activation lifted from 32% to 73% and support tickets dropped by half.', 'https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&q=85', array['saas','onboarding','ai'], 'SaaS & Software', 'Lumen', 'published'),
('bowline-commerce-hub', 'Bowline Commerce Hub', 'Unified order, support and retention automation across Shopify and Klaviyo.', 'Customer lifetime value rose 27% in 90 days through automated win-back, VIP and review flows.', 'https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['ecommerce','retention','automation'], 'E-commerce', 'Bowline Co.', 'published'),
('meridian-finance-dashboard', 'Meridian Finance Dashboard', 'Real-time exec dashboard pulling from QuickBooks, Stripe and Hubspot.', 'Daily exec reporting is now automated. Close-of-month went from 9 days to under 2.', 'https://images.unsplash.com/photo-1760978631985-590e3b5f4057?crop=entropy&cs=srgb&fm=jpg&q=85', array['finance','dashboard','data'], 'Finance & Fintech', 'Meridian Capital', 'published'),
('foundry-creators-suite', 'Foundry Creators Suite', 'Personal brand OS for a 500K-follower founder.', 'Content engine produces 18 multi-platform assets from a single recorded session each week.', 'https://images.pexels.com/photos/3612930/pexels-photo-3612930.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['creator','content','automation'], 'Creators & Founders', 'Foundry', 'published')
on conflict (slug) do nothing;

-- Case studies ----------------------------------------------------------------
insert into public.case_studies (slug, title, summary, cover, tags, metrics, problem, solution, result) values
('northwind-delivery-time-38', 'How Northwind cut delivery time by 38%', 'From 7 tools to 1 unified operating system in 6 weeks.', 'https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?crop=entropy&cs=srgb&fm=jpg&q=85', array['agency','operations'],
'[{"label":"Delivery time","value":"-38%"},{"label":"Admin hours","value":"-12h/wk"},{"label":"Client NPS","value":"+24"}]'::jsonb,
'Northwind ran on 7 disconnected SaaS tools. Project status was unclear, billing was manual and retention was suffering.',
'We mapped their delivery workflow, designed a unified pipeline + project + invoicing schema, and built a custom founder dashboard.',
'Within two cycles, delivery time dropped 38%, retention improved, and the leadership team reclaimed 12+ hours per week.'),
('lumen-activation-73', 'Lifting Lumen activation from 32% to 73%', 'A conversational AI guide replaces a 14-step wizard.', 'https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&q=85', array['saas','ai'],
'[{"label":"Activation","value":"+41%"},{"label":"Tickets","value":"-52%"},{"label":"Time to value","value":"-63%"}]'::jsonb,
'Lumen new users dropped off during a 14-step onboarding flow. Activation sat at 32% and support was overwhelmed.',
'We designed an AI copilot that asks 3 questions and configures the workspace automatically.',
'Activation climbed to 73%, support tickets halved, and time-to-value dropped by 63%.'),
('atlas-health-frontdesk-60', 'Atlas Health: 60% less front-desk work', 'Automated patient intake & scheduling without breaking compliance.', 'https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['healthcare','portal'],
'[{"label":"Front-desk time","value":"-60%"},{"label":"No-shows","value":"-31%"},{"label":"Patient CSAT","value":"+19"}]'::jsonb,
'Atlas Health front desk drowned in paperwork and reminders, with no-shows above 22%.',
'We built a patient portal with secure intake forms, automated scheduling and SMS reminder workflows.',
'Front-desk admin time fell 60%, no-shows dropped 31%, and patient satisfaction rose substantially.')
on conflict (slug) do nothing;

-- Blog posts ------------------------------------------------------------------
insert into public.blog_posts (slug, title, excerpt, body, cover, tags, category, status, author_name, author_avatar, read_time, published_at) values
('the-founder-os', 'The Founder OS — what it is and why every operator needs one', 'A Founder OS is a single, opinionated workspace that ties together people, money, projects and content.', 'Most founders run their business out of 9 tabs and 4 group chats. A Founder OS replaces that with a single, opinionated workspace tied to the way *you* run. Here is the architecture I use with every client.', 'https://images.unsplash.com/photo-1760978631985-590e3b5f4057?crop=entropy&cs=srgb&fm=jpg&q=85', array['founder','systems'], 'Systems', 'published', 'Shamim Noor', 'https://avatars.githubusercontent.com/u/5306684?v=4', 4, now()),
('n8n-vs-zapier-vs-make-2026', 'n8n vs. Zapier vs. Make — a 2026 buyer guide', 'Which automation platform should your business actually run on this year?', 'Each platform has a sweet spot. Zapier wins on integrations breadth, Make wins on visual workflows, and n8n wins on ownership and AI. Here is how I choose for each engagement.', 'https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['automation','tools'], 'Automation', 'published', 'Shamim Noor', 'https://avatars.githubusercontent.com/u/5306684?v=4', 6, now()),
('dashboards-founders-actually-open', 'How I design dashboards founders actually open', 'Dashboards die when they answer questions nobody asked. Here is the framework I use.', 'A founder dashboard is a *decision surface*, not a data dump. I design every dashboard around the 3 decisions the founder has to make this week.', 'https://images.pexels.com/photos/27141307/pexels-photo-27141307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['dashboards','design'], 'Design', 'published', 'Shamim Noor', 'https://avatars.githubusercontent.com/u/5306684?v=4', 5, now()),
('ai-copilots-that-dont-hallucinate', 'Building AI copilots that do not hallucinate on your business', 'A practical guide to grounding GPT in your own knowledge base.', 'Most internal copilots fail because they live too far from your data. Here is the retrieval + guardrail pattern I ship in every engagement.', 'https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&q=85', array['ai','copilots'], 'AI', 'published', 'Shamim Noor', 'https://avatars.githubusercontent.com/u/5306684?v=4', 7, now()),
('retainer-model-systems-work', 'The retainer model I use for systems work', 'How to price ongoing systems work without trading hours for dollars.', 'I price retainers around outcomes and surface area, never hours. Here is the exact framework I use to scope, propose and renew.', 'https://images.pexels.com/photos/3612930/pexels-photo-3612930.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', array['pricing','business'], 'Business', 'published', 'Shamim Noor', 'https://avatars.githubusercontent.com/u/5306684?v=4', 5, now())
on conflict (slug) do nothing;

-- Resources -------------------------------------------------------------------
insert into public.resources (title, type, summary, url, cover) values
('Founder OS Notion Template', 'Template', 'The exact Notion workspace I deploy with every founder client.', '#', 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?crop=entropy&cs=srgb&fm=jpg&q=85'),
('Agency Pipeline Schema', 'Schema', 'Stages, fields and automations for a modern agency CRM.', '#', 'https://images.pexels.com/photos/923307/pexels-photo-923307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'),
('Automation Audit Checklist', 'Checklist', '27 questions I ask to find $50K+ of automation in any business.', '#', 'https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'),
('Proposal Generator Prompt Pack', 'Prompts', 'GPT prompts that draft consulting proposals in minutes.', '#', 'https://images.unsplash.com/photo-1716191299980-a6e8827ba10b?crop=entropy&cs=srgb&fm=jpg&q=85')
on conflict do nothing;
