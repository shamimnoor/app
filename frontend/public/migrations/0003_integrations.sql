-- ============================================================================
-- Migration 0003 — Integrations Hub
-- Founder-only key/value store for runtime configuration (n8n, OpenAI,
-- GitHub, Vercel, etc.). Replaces having to set env vars for everything.
-- ============================================================================

create table if not exists public.integrations (
  id text primary key,                       -- 'n8n' | 'openai' | 'github' | 'vercel' | 'google_oauth' | 'domain'
  config jsonb not null default '{}'::jsonb, -- per-integration shape
  status text not null default 'disconnected', -- 'connected' | 'disconnected' | 'error'
  status_message text default '',
  last_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.integrations enable row level security;

-- Founder can read + write; nobody else has access (not even the anon REST role).
drop policy if exists "integrations founder all" on public.integrations;
create policy "integrations founder all" on public.integrations
  for all using (public.is_founder()) with check (public.is_founder());

-- Seed empty rows so the UI always has something to render
insert into public.integrations (id) values
  ('n8n'), ('openai'), ('github'), ('vercel'), ('google_oauth'), ('domain')
on conflict (id) do nothing;
