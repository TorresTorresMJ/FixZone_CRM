-- Migration 35: Marca rápida "Esperando pieza" en tickets
--
-- Agrega un flag rápido (checkbox) + nota opcional a service_tickets para
-- señalar que un ticket está detenido en cualquier etapa porque se espera
-- una pieza/refacción. No depende de la etapa (stage) del kanban.

alter table public.service_tickets
  add column if not exists waiting_part boolean not null default false,
  add column if not exists waiting_part_note text;
