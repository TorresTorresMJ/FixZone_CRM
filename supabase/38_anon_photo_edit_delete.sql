-- Migration 38: Allow ticket-tech.html (anon) to fix or remove photos
--
-- The tech page tags each photo with whatever stage the ticket is in at
-- upload time. If the technician forgets to upload "Recibido" photos before
-- moving the ticket to "En reparacion", those photos get mistagged and,
-- until now, could never be corrected or deleted from the public page.

DROP POLICY IF EXISTS "anon can update attachments" ON public.attachments;
CREATE POLICY "anon can update attachments"
  ON public.attachments
  FOR UPDATE TO anon
  USING (ticket_id IS NOT NULL)
  WITH CHECK (ticket_id IS NOT NULL);

DROP POLICY IF EXISTS "anon can delete attachments" ON public.attachments;
CREATE POLICY "anon can delete attachments"
  ON public.attachments
  FOR DELETE TO anon
  USING (ticket_id IS NOT NULL);

DROP POLICY IF EXISTS "anon can delete ticket photos" ON storage.objects;
CREATE POLICY "anon can delete ticket photos"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'ticket-photos');
