-- Image storage for /share drops (absolute $0 tier: Supabase Storage free 1 GB).
-- Run once in Supabase Dashboard → SQL Editor, after 0001_tracker_data.sql.
-- Public read (drops are share links by nature), writes scoped to the owner's folder.

insert into storage.buckets (id, name, public)
values ('drops', 'drops', true)
on conflict (id) do update set public = true;

drop policy if exists "drops public read" on storage.objects;
drop policy if exists "drops owner insert" on storage.objects;
drop policy if exists "drops owner update" on storage.objects;
drop policy if exists "drops owner delete" on storage.objects;

create policy "drops public read"
  on storage.objects for select
  using (bucket_id = 'drops');

create policy "drops owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'drops'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "drops owner update"
  on storage.objects for update
  using (
    bucket_id = 'drops'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'drops'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "drops owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'drops'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
