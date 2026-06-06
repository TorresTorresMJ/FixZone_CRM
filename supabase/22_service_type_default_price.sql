-- Migration 22: Precio base por tipo de servicio
-- Aplica cuando no hay precio específico dispositivo × servicio en service_prices.
-- Útil para servicios de precio fijo (Diagnóstico $350, Limpieza $350, etc.)

ALTER TABLE public.service_types
  ADD COLUMN IF NOT EXISTS default_price numeric(10,2) NOT NULL DEFAULT 0;

-- Precio predeterminado para diagnóstico y limpieza
UPDATE public.service_types SET default_price = 350 WHERE name IN ('Diagnóstico','Limpieza');

-- Agregar Limpieza si no existe
INSERT INTO public.service_types (name, sort_order, default_price)
  VALUES ('Limpieza', 17, 350)
  ON CONFLICT DO NOTHING;
