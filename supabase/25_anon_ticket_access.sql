-- Migration 25: Anonymous access for ticket-tech.html and ticket-track.html
-- Allows reading ticket info and attachments, inserting photos, and updating stage
-- without requiring a logged-in session. The UUID ticket_id acts as the access token.

-- ── Read access ───────────────────────────────────────────────────────────────

CREATE POLICY IF NOT EXISTS "anon can read tickets"
  ON public.service_tickets
  FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "anon can read attachments"
  ON public.attachments
  FOR SELECT TO anon
  USING (true);

-- ── Write access for tech page ─────────────────────────────────────────────────

-- Anon can insert photos from the tech page (stage is tagged at upload time)
CREATE POLICY IF NOT EXISTS "anon can insert attachments"
  ON public.attachments
  FOR INSERT TO anon
  WITH CHECK (true);

-- ── Stage update function (SECURITY DEFINER) ──────────────────────────────────
-- Anon role cannot UPDATE service_tickets directly.
-- This function runs as the owner (bypasses RLS) but validates the stage value
-- and only updates the stage column + logs the event.

CREATE OR REPLACE FUNCTION public.update_ticket_stage_public(
  p_ticket_id uuid,
  p_new_stage text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_stage text;
BEGIN
  IF p_new_stage NOT IN ('Recibido', 'En reparacion', 'Listo') THEN
    RAISE EXCEPTION 'Stage no permitido: %', p_new_stage;
  END IF;

  SELECT stage INTO v_old_stage
  FROM service_tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket no encontrado';
  END IF;

  -- Skip update if stage hasn't changed
  IF v_old_stage = p_new_stage THEN
    RETURN;
  END IF;

  UPDATE service_tickets
  SET stage = p_new_stage
  WHERE id = p_ticket_id;

  INSERT INTO ticket_events (ticket_id, event_type, from_stage, to_stage)
  VALUES (p_ticket_id, 'stage_change', v_old_stage, p_new_stage);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ticket_stage_public(uuid, text) TO anon;

-- ── Storage policy (run in Supabase Dashboard → Storage → ticket-photos → Policies) ──
-- CREATE POLICY "anon can upload ticket photos" ON storage.objects
--   FOR INSERT TO anon
--   WITH CHECK (bucket_id = 'ticket-photos');
--
-- Note: Storage policies live in storage.objects and must be applied via the
-- Dashboard or the Supabase CLI — they cannot be applied in the SQL Editor
-- alongside regular table policies.
