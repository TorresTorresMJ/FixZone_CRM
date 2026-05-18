-- Storage bucket policies for 'ticket-photos'.
-- Supabase Storage uses the storage.objects table with its own RLS,
-- completely separate from the public.* table policies.
--
-- Run in Supabase SQL Editor.

-- Allow any authenticated employee to upload photos
drop policy if exists "authenticated users can upload ticket photos" on storage.objects;
create policy "authenticated users can upload ticket photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ticket-photos'
  and private.is_active_employee()
);

-- Allow any authenticated employee to read/view photos
drop policy if exists "authenticated users can read ticket photos" on storage.objects;
create policy "authenticated users can read ticket photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'ticket-photos'
  and private.is_active_employee()
);

-- Allow authenticated employees to delete photos
drop policy if exists "authenticated users can delete ticket photos" on storage.objects;
create policy "authenticated users can delete ticket photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'ticket-photos'
  and private.is_active_employee()
);

-- Also allow public read (for the img src URLs to load in browser without auth)
drop policy if exists "public can view ticket photos" on storage.objects;
create policy "public can view ticket photos"
on storage.objects for select to public
using (bucket_id = 'ticket-photos');
