-- Migration 21: Tabla de precios por dispositivo × servicio
-- service_types: lista configurable de servicios (columnas de la matriz)
-- service_prices: precio por combinación dispositivo + servicio + sucursal

CREATE TABLE IF NOT EXISTS public.service_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_prices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_model    text NOT NULL,
  service_type_id uuid NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  price           numeric(10,2) NOT NULL DEFAULT 0,
  branch_id       uuid REFERENCES public.branches(id),
  notes           text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (device_model, service_type_id, branch_id)
);

-- RLS
ALTER TABLE public.service_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active employees can read service_types"
  ON public.service_types FOR SELECT USING (private.is_active_employee());

CREATE POLICY "admin can manage service_types"
  ON public.service_types FOR ALL
  USING     (private.has_employee_role(ARRAY['owner','admin','it']))
  WITH CHECK(private.has_employee_role(ARRAY['owner','admin','it']));

CREATE POLICY "active employees can read service_prices"
  ON public.service_prices FOR SELECT USING (private.is_active_employee());

CREATE POLICY "admin can manage service_prices"
  ON public.service_prices FOR ALL
  USING     (private.has_employee_role(ARRAY['owner','admin','it']))
  WITH CHECK(private.has_employee_role(ARRAY['owner','admin','it']));

-- Add service_type column to service_tickets (stores the selected service label)
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS service_type text;

-- Servicios predeterminados
INSERT INTO public.service_types (name, sort_order) VALUES
  ('Cambio de pantalla',     1),
  ('Cambio de batería',      2),
  ('Puerto de carga',        3),
  ('Bocina / altavoz',       4),
  ('Micrófono',              5),
  ('Cámara frontal',         6),
  ('Cámara trasera',         7),
  ('Botones',                8),
  ('Face ID / Touch ID',     9),
  ('Daño por agua',         10),
  ('Diagnóstico',           11),
  ('Otro',                  12)
ON CONFLICT DO NOTHING;
