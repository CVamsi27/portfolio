-- Tracker sync storage (absolute $0 tier: Supabase free, no card required).
-- Run this once in Supabase Dashboard → SQL Editor.
-- One row per (user, tracker-key). RLS keeps every user isolated.

create table if not exists public.tracker_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.tracker_data enable row level security;

drop policy if exists "tracker_data_owner" on public.tracker_data;

create policy "tracker_data_owner"
  on public.tracker_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
