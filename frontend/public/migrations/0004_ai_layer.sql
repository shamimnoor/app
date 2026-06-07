-- ============================================================================
-- Migration 0004 — AI Brain Layer
-- Memory + Context + Knowledge (RAG) store used by every agent & workflow.
-- All tables are founder-only via the existing public.is_founder() helper.
-- ============================================================================

-- 1. AI Memory ----------------------------------------------------------------
-- Persistent long-term memory the founder/agents can write to.
-- kind: 'fact' | 'preference' | 'context' | 'goal' | 'note'
create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'note',
  title text not null default '',
  content text not null,
  tags text[] not null default '{}',
  importance int not null default 3 check (importance between 1 and 5),
  source text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_memory_kind_idx on public.ai_memory (kind);
create index if not exists ai_memory_tags_idx on public.ai_memory using gin (tags);
create index if not exists ai_memory_search_idx on public.ai_memory
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

alter table public.ai_memory enable row level security;
drop policy if exists "ai_memory founder all" on public.ai_memory;
create policy "ai_memory founder all" on public.ai_memory
  for all using (public.is_founder()) with check (public.is_founder());

-- 2. AI Knowledge (RAG) -------------------------------------------------------
-- Documents the agents can retrieve from when answering questions.
-- source_type: 'doc' | 'url' | 'note' | 'transcript' | 'sop'
create table if not exists public.ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null default 'doc',
  source_url text default '',
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_knowledge_tags_idx on public.ai_knowledge using gin (tags);
create index if not exists ai_knowledge_search_idx on public.ai_knowledge
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

alter table public.ai_knowledge enable row level security;
drop policy if exists "ai_knowledge founder all" on public.ai_knowledge;
create policy "ai_knowledge founder all" on public.ai_knowledge
  for all using (public.is_founder()) with check (public.is_founder());

-- 3. AI Conversations + Messages ---------------------------------------------
-- Threaded conversation log. Each turn knows which agent produced it.
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  agent_id text default null,        -- last agent that wrote
  workflow_id uuid default null,     -- if this was a workflow run
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  agent_id text default null,
  content text not null,
  tokens int default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conv_idx on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
drop policy if exists "ai_conversations founder all" on public.ai_conversations;
create policy "ai_conversations founder all" on public.ai_conversations
  for all using (public.is_founder()) with check (public.is_founder());
drop policy if exists "ai_messages founder all" on public.ai_messages;
create policy "ai_messages founder all" on public.ai_messages
  for all using (public.is_founder()) with check (public.is_founder());

-- 4. Simple search RPC --------------------------------------------------------
-- Lightweight text search over knowledge (lexical, no embeddings required).
create or replace function public.search_knowledge(q text, max_rows int default 5)
returns table (id uuid, title text, content text, source_type text, source_url text, score real)
language sql
stable security definer set search_path = public
as $$
  select k.id, k.title, k.content, k.source_type, k.source_url,
         ts_rank(to_tsvector('simple', coalesce(k.title,'') || ' ' || coalesce(k.content,'')),
                 plainto_tsquery('simple', q)) as score
  from public.ai_knowledge k
  where to_tsvector('simple', coalesce(k.title,'') || ' ' || coalesce(k.content,''))
        @@ plainto_tsquery('simple', q)
  order by score desc
  limit greatest(max_rows, 1)
$$;
