-- ============================================================================
-- Shamim Noor — Founder OS · Supabase Initial Schema
-- Apply via Supabase Dashboard → SQL Editor → New query → paste & Run
-- Or via Supabase CLI:  supabase db push
-- ============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES — extends auth.users
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null default '',
  avatar text default '',
  role text not null default 'user' check (role in ('user', 'founder')),
  bio text default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles
  for select using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile after signup, auto-assign founder role for founder email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  founder_email text := 'shamimnoorofficial@gmail.com';
  new_role text := 'user';
  new_name text := coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  new_avatar text := coalesce(new.raw_user_meta_data->>'avatar', new.raw_user_meta_data->>'avatar_url', '');
begin
  if lower(new.email) = lower(founder_email) then
    new_role := 'founder';
    if new_avatar = '' then
      new_avatar := 'https://customer-assets.emergentagent.com/job_2cbfbaf5-49b3-4e72-aa18-4e9dcb61b843/artifacts/extptqfd_profile-pic.jpg';
    end if;
  end if;
  insert into public.profiles (id, email, name, avatar, role)
  values (new.id, new.email, new_name, new_avatar, new_role)
  on conflict (id) do update set
    email = excluded.email,
    role = case when excluded.role = 'founder' then 'founder' else public.profiles.role end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper function: is current user the founder?
create or replace function public.is_founder()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'founder'
  );
$$;

-- ============================================================================
-- 2. CONTENT — services, solutions, industries, resources (public read)
-- ============================================================================
create table if not exists public.services (
  id text primary key,
  title text not null,
  icon text default 'Sparkles',
  tagline text default '',
  description text default '',
  deliverables jsonb default '[]'::jsonb,
  starting_price text default '',
  sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
drop policy if exists "services public read" on public.services;
create policy "services public read" on public.services for select using (true);
drop policy if exists "services founder write" on public.services;
create policy "services founder write" on public.services for all using (public.is_founder()) with check (public.is_founder());

create table if not exists public.solutions (
  id text primary key,
  title text not null,
  summary text default '',
  sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.solutions enable row level security;
drop policy if exists "solutions public read" on public.solutions;
create policy "solutions public read" on public.solutions for select using (true);
drop policy if exists "solutions founder write" on public.solutions;
create policy "solutions founder write" on public.solutions for all using (public.is_founder()) with check (public.is_founder());

create table if not exists public.industries (
  id text primary key,
  name text not null,
  blurb text default '',
  sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.industries enable row level security;
drop policy if exists "industries public read" on public.industries;
create policy "industries public read" on public.industries for select using (true);
drop policy if exists "industries founder write" on public.industries;
create policy "industries founder write" on public.industries for all using (public.is_founder()) with check (public.is_founder());

create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text default 'Template',
  summary text default '',
  url text default '#',
  cover text default '',
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
drop policy if exists "resources public read" on public.resources;
create policy "resources public read" on public.resources for select using (true);
drop policy if exists "resources founder write" on public.resources;
create policy "resources founder write" on public.resources for all using (public.is_founder()) with check (public.is_founder());

-- ============================================================================
-- 3. PROJECTS
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text default '',
  body text default '',
  cover text default '',
  tags text[] default '{}',
  industry text default '',
  client text default '',
  status text not null default 'published' check (status in ('draft','published','archived')),
  views int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists projects_status_created_idx on public.projects(status, created_at desc);
alter table public.projects enable row level security;
drop policy if exists "projects public read published" on public.projects;
create policy "projects public read published" on public.projects for select using (status = 'published' or public.is_founder());
drop policy if exists "projects founder write" on public.projects;
create policy "projects founder write" on public.projects for all using (public.is_founder()) with check (public.is_founder());

-- Allow anyone to increment views (no auth required)
create or replace function public.increment_project_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.projects set views = views + 1 where slug = p_slug;
$$;

-- ============================================================================
-- 4. CASE STUDIES
-- ============================================================================
create table if not exists public.case_studies (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text default '',
  cover text default '',
  tags text[] default '{}',
  metrics jsonb default '[]'::jsonb,
  problem text default '',
  solution text default '',
  result text default '',
  views int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.case_studies enable row level security;
drop policy if exists "case_studies public read" on public.case_studies;
create policy "case_studies public read" on public.case_studies for select using (true);
drop policy if exists "case_studies founder write" on public.case_studies;
create policy "case_studies founder write" on public.case_studies for all using (public.is_founder()) with check (public.is_founder());

create or replace function public.increment_case_study_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.case_studies set views = views + 1 where slug = p_slug;
$$;

-- ============================================================================
-- 5. BLOG POSTS
-- ============================================================================
create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  excerpt text default '',
  body text default '',
  cover text default '',
  tags text[] default '{}',
  category text default 'General',
  status text not null default 'published' check (status in ('draft','published','archived')),
  author_name text default 'Shamim Noor',
  author_avatar text default '',
  read_time int default 3,
  views int not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists blog_posts_status_created_idx on public.blog_posts(status, created_at desc);
alter table public.blog_posts enable row level security;
drop policy if exists "blog public read published" on public.blog_posts;
create policy "blog public read published" on public.blog_posts for select using (status = 'published' or public.is_founder());
drop policy if exists "blog founder write" on public.blog_posts;
create policy "blog founder write" on public.blog_posts for all using (public.is_founder()) with check (public.is_founder());

create or replace function public.increment_blog_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.blog_posts set views = views + 1 where slug = p_slug;
$$;

-- ============================================================================
-- 6. LEADS  (contact / hire submissions)
-- ============================================================================
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text default '',
  budget text default '',
  timeline text default '',
  message text not null,
  source text default 'contact',
  status text not null default 'new' check (status in ('new','qualified','proposal','won','lost')),
  notes text default '',
  created_at timestamptz not null default now()
);
create index if not exists leads_status_created_idx on public.leads(status, created_at desc);
alter table public.leads enable row level security;
drop policy if exists "leads anonymous insert" on public.leads;
create policy "leads anonymous insert" on public.leads for insert with check (true);
drop policy if exists "leads founder read" on public.leads;
create policy "leads founder read" on public.leads for select using (public.is_founder());
drop policy if exists "leads founder update" on public.leads;
create policy "leads founder update" on public.leads for update using (public.is_founder());

-- ============================================================================
-- 7. MESSAGES  (user <-> founder direct chat)
-- ============================================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  thread_user_id uuid not null references public.profiles(id) on delete cascade,
  from_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_created_idx on public.messages(thread_user_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "messages read self or founder" on public.messages;
create policy "messages read self or founder" on public.messages
  for select using (thread_user_id = auth.uid() or public.is_founder());
drop policy if exists "messages insert self or founder" on public.messages;
create policy "messages insert self or founder" on public.messages
  for insert with check (
    from_id = auth.uid()
    and (
      (thread_user_id = auth.uid() and not public.is_founder())
      or public.is_founder()
    )
  );

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null,
  content_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_content_idx on public.comments(content_type, content_id, created_at desc);
alter table public.comments enable row level security;
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments delete own or founder" on public.comments;
create policy "comments delete own or founder" on public.comments for delete using (auth.uid() = user_id or public.is_founder());

-- ============================================================================
-- 9. LIKES (anonymous via fingerprint OR authenticated user)
-- ============================================================================
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null,
  content_id text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  anon_fingerprint text,
  created_at timestamptz not null default now(),
  unique (content_type, content_id, user_id),
  unique (content_type, content_id, anon_fingerprint)
);
create index if not exists likes_content_idx on public.likes(content_type, content_id);
alter table public.likes enable row level security;
drop policy if exists "likes public read" on public.likes;
create policy "likes public read" on public.likes for select using (true);
drop policy if exists "likes anonymous insert" on public.likes;
create policy "likes anonymous insert" on public.likes for insert with check (true);
drop policy if exists "likes delete self" on public.likes;
create policy "likes delete self" on public.likes for delete using (
  user_id = auth.uid() or (user_id is null and auth.uid() is null)
);

-- ============================================================================
-- 10. BOOKMARKS  (authenticated only)
-- ============================================================================
create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null,
  content_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default '',
  created_at timestamptz not null default now(),
  unique (content_type, content_id, user_id)
);
alter table public.bookmarks enable row level security;
drop policy if exists "bookmarks read own" on public.bookmarks;
create policy "bookmarks read own" on public.bookmarks for select using (auth.uid() = user_id);
drop policy if exists "bookmarks write own" on public.bookmarks;
create policy "bookmarks write own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 11. COMMUNITY POSTS
-- ============================================================================
create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_created_idx on public.community_posts(created_at desc);
alter table public.community_posts enable row level security;
drop policy if exists "community public read" on public.community_posts;
create policy "community public read" on public.community_posts for select using (true);
drop policy if exists "community insert own" on public.community_posts;
create policy "community insert own" on public.community_posts for insert with check (auth.uid() = user_id);
drop policy if exists "community delete own or founder" on public.community_posts;
create policy "community delete own or founder" on public.community_posts for delete using (auth.uid() = user_id or public.is_founder());

-- ============================================================================
-- 12. REALTIME — enable on relevant tables
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.community_posts;
alter publication supabase_realtime add table public.likes;

-- ============================================================================
-- DONE. Now run 0002_seed.sql to populate initial content.
-- ============================================================================
