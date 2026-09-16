-- Public share links for /share drops (absolute $0 tier).
-- Run once in Supabase Dashboard → SQL Editor, after 0002.
-- Anyone with the unguessable link id can read ONLY unexpired rows.
-- Owners manage (create/revoke) their own rows while signed in.

create table if not exists public.shared_drops (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  text text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz, -- null = never expires
  created_from_drop text -- original local drop id, for bookkeeping
);

alter table public.shared_drops enable row level security;

drop policy if exists "shared_drops public read unexpired" on public.shared_drops;
drop policy if exists "shared_drops owner all" on public.shared_drops;

-- Public (incl. anon): read unexpired, non-null-guarded rows by link id.
create policy "shared_drops public read unexpired"
  on public.shared_drops for select
  using (expires_at is null or expires_at > now());

-- Owner: full control over own rows (needs select too for management UI).
create policy "shared_drops owner all"
  on public.shared_drops for all
  using (auth.uid() = owner)
  with check (auth.uid() = owner);
