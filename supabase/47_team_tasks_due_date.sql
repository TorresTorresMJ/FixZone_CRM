-- Migration 47: Fecha límite en tareas del equipo
-- Permite asignar una fecha límite opcional a un pendiente del checklist de
-- equipo (icono junto a la campanita), para poder listarlos por vencimiento
-- en el dashboard de Home.

alter table public.team_tasks
  add column if not exists due_date date;

create index if not exists team_tasks_due_date_idx on public.team_tasks (due_date);
