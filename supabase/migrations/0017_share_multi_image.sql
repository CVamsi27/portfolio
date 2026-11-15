-- Multiple images per shared drop. Run after 0005_private_share_media.sql.
--
-- Drop galleries live in tracker_data, but a share link publishes the drop to
-- shared_drops, which only had room for a single image. This adds the gallery
-- column and lets allowlisted viewers sign every published image.
-- The app degrades to the first image when this migration has not run yet.

alter table public.shared_drops
  add column if not exists image_paths text[] not null default '{}';

update public.shared_drops
set image_paths = array[image_path]
where image_path is not null
  and (image_paths is null or cardinality(image_paths) = 0);

drop policy if exists "drops shared viewer read" on storage.objects;

create policy "drops shared viewer read"
  on storage.objects for select
  using (
    bucket_id = 'drops'
    and exists (
      select 1
      from public.shared_drops
      where (image_path = storage.objects.name or storage.objects.name = any (image_paths))
        and (expires_at is null or expires_at > now())
        and (
          auth.uid() = owner
          or (is_public = true)
          or (auth.jwt() ->> 'email') = any (allowed_emails)
        )
    )
  );
