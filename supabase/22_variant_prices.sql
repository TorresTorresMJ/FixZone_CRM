-- Migration 22: variantes de precio por celda (calidad de pantalla, etc.)
-- Idempotente — se puede correr múltiples veces.

-- 1. Añadir columna variant (empty string = precio único, default)
ALTER TABLE public.service_prices
  ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT '';

-- 2. Reemplazar unique constraint para incluir variant
ALTER TABLE public.service_prices
  DROP CONSTRAINT IF EXISTS service_prices_device_model_service_type_id_branch_id_key;

ALTER TABLE public.service_prices
  DROP CONSTRAINT IF EXISTS service_prices_unique_with_variant;

ALTER TABLE public.service_prices
  ADD CONSTRAINT service_prices_unique_with_variant
  UNIQUE (device_model, service_type_id, branch_id, variant);
