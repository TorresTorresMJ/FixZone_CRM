-- Migration 30: Add PIN unlock service types
-- Desbloqueo de PIN and Desbloqueo de PIN + cuenta are flat-fee services
-- with no device-specific pricing; set default_price from the Precios view.

INSERT INTO public.service_types (name, sort_order, default_price)
VALUES
  ('Desbloqueo de PIN',          18, 0),
  ('Desbloqueo de PIN + cuenta', 19, 0)
ON CONFLICT (name) DO NOTHING;
