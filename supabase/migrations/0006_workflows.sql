-- ============================================================================
-- Migration 0006 — Multi-Agent Workflow Engine
-- Define and run sequential chains of agents.
-- Founder-only RLS via public.is_founder().
-- ============================================================================

create table if not exists public.ai_workflows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  -- steps is an ordered array of: { agent_id: text, instructions: text }
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.ai_workflows(id) on delete set null,
  input text not null default '',
  -- steps_output is an array of: { agent_id, output, started_at, completed_at }
  steps_output jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  error text default '',
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_workflow_runs_workflow_idx on public.ai_workflow_runs (workflow_id, started_at desc);

alter table public.ai_workflows enable row level security;
alter table public.ai_workflow_runs enable row level security;
drop policy if exists "ai_workflows founder all" on public.ai_workflows;
create policy "ai_workflows founder all" on public.ai_workflows
  for all using (public.is_founder()) with check (public.is_founder());
drop policy if exists "ai_workflow_runs founder all" on public.ai_workflow_runs;
create policy "ai_workflow_runs founder all" on public.ai_workflow_runs
  for all using (public.is_founder()) with check (public.is_founder());

-- Seed flagship workflow chains ----------------------------------------------
insert into public.ai_workflows (slug, name, description, steps, sort_order) values
('research-to-prompt', 'Research → Architecture → Prompt',
 'Route an idea through Research → System Architecture → Prompt Engineering to produce a build-ready prompt.',
 '[
    {"agent_id":"researcher","instructions":"Produce a structured research brief on the user request."},
    {"agent_id":"architect","instructions":"Take the brief and design a clear technical blueprint."},
    {"agent_id":"prompt-engineer","instructions":"Convert the brief + architecture into a refined build prompt with model + format suggestions."}
  ]'::jsonb,
 10),
('exec-board', 'CEO → COO → CFO Review',
 'Run a single decision through the CEO (strategy), COO (operations), and CFO (numbers) to stress-test it.',
 '[
    {"agent_id":"ceo","instructions":"Give the strategic memo on this decision."},
    {"agent_id":"coo","instructions":"Translate that strategy into operating cadence and SOPs."},
    {"agent_id":"cfo","instructions":"Pressure-test the financial logic and unit economics."}
  ]'::jsonb,
 20),
('marketing-launch', 'CMO → Copywriter → SEO',
 'Take a product or post and run it through the CMO (positioning), Copywriter (messaging) and SEO Strategist (search shape).',
 '[
    {"agent_id":"cmo","instructions":"Define positioning, narrative and 30-day distribution plan."},
    {"agent_id":"copywriter","instructions":"Write three headline variants and a tight launch post."},
    {"agent_id":"seo-strategist","instructions":"Output keyword cluster, meta and internal-link plan."}
  ]'::jsonb,
 30),
('product-spec', 'CPO → Designer → Architect',
 'Take a product idea and shape it into PRD → design direction → technical architecture.',
 '[
    {"agent_id":"cpo","instructions":"Write a crisp PRD with JTBD, scope, anti-scope and metrics."},
    {"agent_id":"designer","instructions":"Propose design direction, hierarchy, palette, type and motion."},
    {"agent_id":"architect","instructions":"Output the technical blueprint, contracts and data flow."}
  ]'::jsonb,
 40)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  steps = excluded.steps,
  sort_order = excluded.sort_order;
