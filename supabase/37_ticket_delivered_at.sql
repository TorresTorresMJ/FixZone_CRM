-- Migration 37: Fecha de entrega sellada en tickets
-- Agrega delivered_at (date) a service_tickets.
-- Se escribe UNA SOLA VEZ cuando el ticket pasa a "Entregado" y nunca se sobrescribe.
-- Sirve como fecha de inicio de garantía en recibos y comprobantes de WhatsApp.

alter table service_tickets
  add column if not exists delivered_at date;

-- Retroactivamente sellar tickets ya entregados usando updated_at como aproximación
update service_tickets
   set delivered_at = updated_at::date
 where stage = 'Entregado'
   and delivered_at is null;
