-- Agrega service_tickets.cancel_reason — guarda el motivo estructurado de una
-- cancelación (ver cancelTicket() en app.js). Antes el motivo solo quedaba como
-- texto libre en ticket_events.note, sin forma confiable de contar cuántos
-- equipos resultaron específicamente "Irreparable" ni de listar qué equipo/falla
-- tenían. El valor 'Irreparable' se usa para la nueva tarjeta de Reportes
-- "Equipos no reparables"; cualquier otro motivo se guarda tal cual lo escribió
-- el usuario, o queda null si no se especificó.
alter table public.service_tickets
  add column if not exists cancel_reason text;
