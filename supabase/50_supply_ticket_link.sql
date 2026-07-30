-- Migration 50: Vincular compras de insumos a un ticket
--
-- Agrega ticket_id a supply_purchases para poder marcar que un insumo
-- (Egresos → Insumos) se compró específicamente para un ticket de reparación,
-- habilitando trazabilidad interna (no se muestra en ningún comprobante o
-- impresión de cara al cliente). También se replica en la transacción de
-- Egreso vinculada (transactions.ticket_id ya existe en el schema base) para
-- que el mismo criterio de trazabilidad usado en anticipos/pagos/abonos
-- aplique a compras de insumos.

alter table public.supply_purchases
  add column if not exists ticket_id uuid references public.service_tickets(id) on delete set null;

create index if not exists supply_purchases_ticket_id_idx on public.supply_purchases(ticket_id);
