-- Migration 29: Technician notes/messages for clients (read on ticket-track.html,
-- write from ticket-tech.html) using the same anon-by-UUID access pattern as
-- migration 25.

-- ── Read access ───────────────────────────────────────────────────────────────
-- Anon can read "note" events only (stage_change events stay internal-only).

DROP POLICY IF EXISTS "anon can read ticket notes" ON public.ticket_events;
CREATE POLICY "anon can read ticket notes"
  ON public.ticket_events
  FOR SELECT TO anon
  USING (event_type = 'note');

-- ── Write access (SECURITY DEFINER) ────────────────────────────────────────────
-- Anon role cannot INSERT into ticket_events directly. This function runs as the
-- owner (bypasses RLS), validates the ticket exists and the note is non-empty.

CREATE OR REPLACE FUNCTION public.add_ticket_note_public(
  p_ticket_id uuid,
  p_note text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_note IS NULL OR length(trim(p_note)) = 0 THEN
    RAISE EXCEPTION 'La nota no puede estar vacía';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_tickets WHERE id = p_ticket_id) THEN
    RAISE EXCEPTION 'Ticket no encontrado';
  END IF;

  INSERT INTO ticket_events (ticket_id, event_type, note)
  VALUES (p_ticket_id, 'note', trim(p_note));
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_ticket_note_public(uuid, text) TO anon;
