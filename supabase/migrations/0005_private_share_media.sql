-- Secure Share media and access modes. Run after 0004_shared_allowlist.sql.

alter table public.shared_drops
  add column if not exists is_public boolean not null default false;

alter table public.shared_drops
  add column if not exists image_path text;

-- Existing public object URLs contain the bucket path after /drops/. Keep the
-- old column for compatibility, but move future reads and writes to image_path.
update public.shared_drops
set image_path = split_part(split_part(image_url, '/drops/', 2), '?', 1)
where image_path is null
  and image_url like '%/drops/%';

insert into storage.buckets (id, name, public)
values ('drops', 'drops', false)
on conflict (id) do update set public = false;

drop policy if exists "drops public read" on storage.objects;
drop policy if exists "drops owner read" on storage.objects;
drop policy if exists "drops shared viewer read" on storage.objects;

create policy "drops owner read"
  on storage.objects for select
  using (
    bucket_id = 'drops'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "drops shared viewer read"
  on storage.objects for select
  using (
    bucket_id = 'drops'
    and exists (
      select 1
      from public.shared_drops
      where image_path = storage.objects.name
        and (expires_at is null or expires_at > now())
        and (
          auth.uid() = owner
          or (auth.jwt() ->> 'email') = any (allowed_emails)
        )
    )
  );

drop policy if exists "shared_drops public read unexpired" on public.shared_drops;
drop policy if exists "shared_drops viewer read" on public.shared_drops;
drop policy if exists "shared_drops owner all" on public.shared_drops;

create policy "shared_drops owner insert"
  on public.shared_drops for insert
  with check (auth.uid() = owner);

create policy "shared_drops owner update"
  on public.shared_drops for update
  using (auth.uid() = owner)
  with check (auth.uid() = owner);

create policy "shared_drops owner delete"
  on public.shared_drops for delete
  using (auth.uid() = owner);

create policy "shared_drops viewer read"
  on public.shared_drops for select
  using (
    (expires_at is null or expires_at > now())
    and (
      auth.uid() = owner
      or (is_public = true)
      or (auth.jwt() ->> 'email') = any (allowed_emails)
    )
  );
