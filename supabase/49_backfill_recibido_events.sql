-- Migration 49: Backfill de eventos "Recibido" perdidos por un bug del frontend
--
-- El form de ticket (activeForm==="ticket") nunca tuvo un campo "status" — el
-- código que arma el payload de creación solo asignaba data.status="Cotizacion"
-- en la rama de cotización, pero no asignaba data.status="Recibido" en la rama
-- normal de tickets. r.status llegaba undefined a createRemoteTicket():
--   - El INSERT igual funcionaba porque service_tickets.stage tiene
--     default 'Recibido' en la DB (la columna simplemente se omite del payload).
--   - Pero logTicketEvent(id,"created",{toStage:r.status}) registraba
--     to_stage = null en vez de 'Recibido' (opts.toStage || null).
--   - Y recibido_sealed_at nunca se sellaba (el bloque está gateado por
--     r.status === "Recibido", que nunca era cierto).
-- El código ya se corrigió (data.status="Recibido" explícito). Esta migración
-- repara los datos ya insertados con el bug, para que la gráfica de afluencia
-- (Reportes → Afluencia de clientes) cuente correctamente los tickets creados
-- antes del fix.
--
-- Es seguro asumir to_stage='Recibido' para estas filas: la única forma de que
-- exista una fila event_type='created' con to_stage null es este bug — la rama
-- de cotización siempre guardaba to_stage='Cotizacion' explícitamente.

update public.ticket_events
   set to_stage = 'Recibido'
 where event_type = 'created'
   and to_stage is null;

-- Mismo backfill que 37_stage_dates.sql (columna recibido_sealed_at), por si
-- algún ticket creado después de esa migración también quedó sin sellar por
-- el mismo bug — usa received_at (fecha real de creación) como aproximación.
-- Idempotente: solo toca filas que aún no tienen recibido_sealed_at.
update public.service_tickets
   set recibido_sealed_at = received_at
 where stage <> 'Cotizacion'
   and recibido_sealed_at is null;
