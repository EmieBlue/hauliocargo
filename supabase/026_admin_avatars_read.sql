-- Admin-wide read access to the avatars bucket. Migration 021 only ever
-- allowed a user to read their own avatar, or a matched customer to read
-- their matched driver's -- no admin-wide exception existed. Same shape as
-- 024/025: one more public.is_admin()-gated policy.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

drop policy if exists "admin reads all avatars" on storage.objects;
create policy "admin reads all avatars" on storage.objects
  for select using (bucket_id = 'avatars' and public.is_admin());

notify pgrst, 'reload schema';
