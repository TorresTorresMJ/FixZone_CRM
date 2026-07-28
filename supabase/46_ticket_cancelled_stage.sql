-- Allows service_tickets.stage to take the value 'Cancelado' — used by the new
-- "Cancelar ticket" button (reparación no se pudo realizar). Cancelling resets
-- paid_amount to 0 / payment_status to 'Pendiente' and, if the ticket had any
-- abono, the frontend logs an Egreso/"Devolución" transaction for the refund
-- so it's reflected in Movimientos, Finanzas y Balance.
alter table public.service_tickets
  drop constraint if exists service_tickets_stage_check;

alter table public.service_tickets
  add constraint service_tickets_stage_check
  check (stage in ('Cotizacion', 'Recibido', 'En reparacion', 'Listo', 'Entregado', 'Garantia', 'Cancelado'));
