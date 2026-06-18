-- Migration 37: Fechas selladas por etapa (cotización / recibido)
--
-- Agrega 2 columnas que capturan, una sola vez, el momento en que el ticket
-- entra a cada etapa clave. Igual que delivered_at (commit 9e03aac en
-- app.js): se sella la PRIMERA vez que el ticket llega a ese stage y nunca
-- se vuelve a sobrescribir automáticamente.
--
--   quoted_at          -> primera vez que stage = 'Cotizacion'
--   recibido_sealed_at -> primera vez que stage = 'Recibido' (independiente
--                         de received_at, que sigue siendo la fecha de
--                         creación de la fila y no debe usarse para esto)
--
-- "Inicio de garantía" sigue usando delivered_at (sellada en 'Entregado'),
-- ya existente desde antes — no se agrega columna nueva para eso.

alter table public.service_tickets
  add column if not exists quoted_at timestamptz,
  add column if not exists recibido_sealed_at timestamptz;

-- Backfill best-effort para tickets ya existentes
update public.service_tickets
  set quoted_at = created_at
  where stage = 'Cotizacion' and quoted_at is null;

update public.service_tickets
  set recibido_sealed_at = received_at
  where stage <> 'Cotizacion' and recibido_sealed_at is null;
