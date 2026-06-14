-- Migration 33: Adjuntar fotos a tareas de soporte (tickets de IT)
--
-- Agrega `task_id` a `attachments` para vincular archivos a una tarea de
-- soporte (support_tasks) en lugar de un ticket de reparación. Reutiliza el
-- bucket de Storage `ticket-photos` (sin cambios de policies de storage,
-- ya permiten a cualquier empleado activo subir/leer/borrar).
--
-- La policy existente "active employees can manage attachments" solo cubre
-- los roles ['owner','admin','sales','technician','it'], lo cual no incluye
-- a 'marketing' ni 'viewer' (roles que también pueden crear tickets de
-- soporte vía el modal de ayuda "?"). Esta migración agrega una policy
-- adicional que permite a CUALQUIER empleado activo gestionar adjuntos
-- cuando `task_id is not null`, sin afectar la policy de adjuntos de tickets.

alter table public.attachments
  add column if not exists task_id uuid references public.support_tasks(id) on delete cascade;

create index if not exists attachments_task_idx on public.attachments (task_id);

drop policy if exists "active employees can manage support task attachments" on public.attachments;
create policy "active employees can manage support task attachments" on public.attachments
for all to authenticated
using (private.is_active_employee() and task_id is not null)
with check (private.is_active_employee() and task_id is not null);
