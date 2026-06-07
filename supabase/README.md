# Supabase Setup

Two SQL files. Run them in order via **Supabase Dashboard → SQL Editor → New query → paste → Run**, or via the Supabase CLI.

## Order

1. `migrations/0001_init.sql` — creates all tables, indexes, RLS policies, triggers and helper functions.
2. `migrations/0002_seed.sql` — inserts seed content (services, solutions, industries, projects, case studies, blog posts, resources). Safe to re-run.

## What the schema gives you

- `profiles` — extends `auth.users`. Auto-populated by an `on_auth_user_created` trigger. The founder email (configured in the trigger) is automatically promoted to `role = 'founder'`.
- `services`, `solutions`, `industries`, `resources` — static content, founder-only writes.
- `projects`, `case_studies`, `blog_posts` — content with view counts and drafts.
- `leads` — anonymous insert (anyone can submit the Contact/Hire forms), founder-only read.
- `messages` — user ↔ founder threads with RLS that lets each user see only their own thread, and the founder see all.
- `comments`, `likes`, `bookmarks`, `community_posts` — social engagement.

## Realtime

`messages`, `comments`, `community_posts`, `likes` are added to the `supabase_realtime` publication so the frontend can subscribe to live updates.

## Helper RPCs

- `increment_project_views(p_slug text)`
- `increment_case_study_views(p_slug text)`
- `increment_blog_views(p_slug text)`
- `is_founder()` — used inside RLS policies.

## CLI alternative

```bash
# Link your Supabase project
supabase link --project-ref uiklspfszgxmywqocisi

# Push the migrations
supabase db push

# (Optional) Reset and reseed
supabase db reset
```
