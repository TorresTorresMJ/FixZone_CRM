-- Migration 36: Fecha límite (due date) en tickets
--
-- Agrega due_date a service_tickets para poder asignar una fecha límite
-- de entrega/atención, ordenar el kanban por esa fecha y dar seguimiento.

alter table public.service_tickets
  add column if not exists due_date date;