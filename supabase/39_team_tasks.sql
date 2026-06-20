-- Migration 39: Checklist de tareas generales del equipo
-- Pendientes no ligados a un ticket ni a soporte IT (investigar, cotizar, comprar, etc.)
-- Cualquier empleado activo puede crear, ver y marcar como hecha una tarea.

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null default 'Otro' check (category in ('Investigar','Cotizar','Comprar','Otro')),
  branch_id uuid references public.branches(id),
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  status text not null default 'pendiente' check (status in ('pendiente','hecha')),
  completed_by uuid references public.employees(id),
  completed_at timestamptz,
  resolution_note text,
  viewed_by jsonb not null default '[]'::jsonb
);

create index if not exists team_tasks_branch_idx on public.team_tasks (branch_id, created_at desc);

alter table public.team_tasks enable row level security;

drop policy if exists "active employees can view team tasks" on public.team_tasks;
create policy "active employees can view team tasks" on public.team_tasks
for select to authenticated using (private.is_active_employee());

drop policy if exists "active employees can add team tasks" on public.team_tasks;
create policy "active employees can add team tasks" on public.team_tasks
for insert to authenticated with check (private.is_active_employee());

drop policy if exists "active employees can update team tasks" on public.team_tasks;
create policy "active employees can update team tasks" on public.team_tasks
for update to authenticated using (private.is_active_employee()) with check (private.is_active_employee());
