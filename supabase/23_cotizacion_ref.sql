-- Migration 23: traceabilidad bidireccional cotización ↔ ticket
-- cotizacion_ref: guarda el folio [COT] original cuando una cotización
--   se convierte en ticket de reparación.
-- converted_to_ticket: guarda el folio [FZ] asignado al aprobar, para
--   que la cotización sepa a qué ticket derivó.

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS cotizacion_ref       text,   -- en tickets: folio [COT] de origen
  ADD COLUMN IF NOT EXISTS converted_to_ticket  text;   -- en cotizaciones: folio [FZ] al que derivó
