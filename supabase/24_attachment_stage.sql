-- Migration 24: Add stage column to attachments
-- Allows tagging photos with the repair stage at which they were taken
-- (used by ticket-tech.html to label photos as Recibido / En reparacion / Listo)
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS stage text;
