-- Migration 16: quote_items column for itemized cotizaciones
-- Adds a JSONB array to service_tickets to store line items on quotes.
-- Each element: { type, description, qty, unitPrice }
-- Apply in Supabase SQL Editor.

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS quote_items jsonb DEFAULT '[]'::jsonb;
