-- Migration 32: Comunicación IT <> Usuario en tareas de soporte
--
-- Agrega un hilo de comentarios a cada tarea de soporte (support_tasks),
-- para que IT pueda responder al empleado que levantó el ticket y viceversa.
--
-- Tambien agrega una policy adicional sobre `notifications` (migration 31)
-- para permitir que cualquier empleado activo envie una notificacion DIRIGIDA
-- (recipient_id no nulo) — antes solo admin/it/owner podian insertar, lo cual
-- bloqueaba que un usuario normal avisara a IT que respondio en el hilo.
-- Los avisos broadcast (recipient_id null) siguen restringidos a admin/it/owner.

create table if not exists public.support_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.support_tasks(id) on delete cascade,
  author_id uuid references public.employees(id),
  author_name text,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_task_comments_task_idx on public.support_task_comments (task_id, created_at);

alter table public.support_task_comments enable row level security;

drop policy if exists "active employees can view support comments" on public.support_task_comments;
create policy "active employees can view support comments" on public.support_task_comments
for select to authenticated
using (private.is_active_employee());

drop policy if exists "active employees can add support comments" on public.support_task_comments;
create policy "active employees can add support comments" on public.support_task_comments
for insert to authenticated
with check (private.is_active_employee());

-- Permite que cualquier empleado activo notifique a otro empleado específico
-- (recipient_id no nulo). Los broadcasts (recipient_id null) siguen siendo
-- exclusivos de admin/it/owner via la policy de migration 31.
drop policy if exists "active employees can send targeted notifications" on public.notifications;
create policy "active employees can send targeted notifications" on public.notifications
for insert to authenticated
with check (private.is_active_employee() and recipient_id is not null);
