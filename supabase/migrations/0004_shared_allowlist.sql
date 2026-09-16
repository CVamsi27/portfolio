-- Private allowlist sharing for /share drops (absolute $0 tier).
-- Run once in Supabase Dashboard → SQL Editor, after 0003.
-- Replaces public links: a row is readable only by its owner or by a
-- signed-in user whose JWT email is in allowed_emails (and unexpired).

alter table public.shared_drops
  add column if not exists allowed_emails text[] not null default '{}';

alter table public.shared_drops
  add column if not exists owner_email text;

drop policy if exists "shared_drops public read unexpired" on public.shared_drops;

drop policy if exists "shared_drops viewer read" on public.shared_drops;

create policy "shared_drops viewer read"
  on public.shared_drops for select
  using (
    (expires_at is null or expires_at > now())
    and (
      auth.uid() = owner
      or (auth.jwt() ->> 'email') = any (allowed_emails)
    )
  );
