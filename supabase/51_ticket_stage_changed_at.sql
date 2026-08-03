-- Agrega service_tickets.stage_changed_at — timestamp exacto (con hora) de cuándo el
-- ticket entró a su etapa (stage) ACTUAL. A diferencia de recibido_sealed_at/quoted_at/
-- delivered_at (que se sellan una sola vez, la primera vez que el ticket pasa por esa
-- etapa, y nunca se sobrescriben — son historial), stage_changed_at se sobrescribe cada
-- vez que el stage cambia, sin importar cuántas veces. Su único propósito es ordenar el
-- kanban ("Más reciente"/"Más antiguo") por columna de forma exacta, en vez de usar
-- updated_at (que también se mueve con CUALQUIER edición del ticket, no solo un cambio
-- de etapa — abonos, notas, fotos, etc. — desordenando las columnas).
alter table public.service_tickets
  add column if not exists stage_changed_at timestamptz;

-- Backfill: usar la fecha sellada de la etapa actual si existe (más precisa), si no
-- caer a updated_at, si no a created_at.
update public.service_tickets
set stage_changed_at = coalesce(
  case
    when stage = 'Recibido'   then recibido_sealed_at
    when stage = 'Cotizacion' then quoted_at
    when stage = 'Entregado'  then delivered_at
    else null
  end,
  updated_at,
  created_at
)
where stage_changed_at is null;
