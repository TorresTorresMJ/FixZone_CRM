-- Migration 31: Centro de notificaciones (Fase 1)
-- Tabla compartida en Supabase para el "aviso al equipo" del centro de
-- notificaciones (campanita). Antes se guardaba solo en localStorage del
-- navegador de quien lo enviaba, por lo que nadie más lo recibía.
--
-- recipient_id = null  -> notificación visible para todos los empleados activos
-- branch_id    = null  -> visible en ambas sucursales
-- read_by      -> array jsonb de employee.id que ya marcaron la notificación como leída

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'broadcast', -- 'broadcast' | 'ticket' | 'aviso' (futuro: disparadores automáticos)
  text text not null,
  author_id uuid references public.employees(id),
  author_name text,
  ticket_id uuid references public.service_tickets(id),
  branch_id uuid references public.branches(id),
  recipient_id uuid references public.employees(id),
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_idx on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "active employees can view notifications" on public.notifications;
create policy "active employees can view notifications" on public.notifications
for select to authenticated
using (private.is_active_employee());

drop policy if exists "admin it can send notifications" on public.notifications;
create policy "admin it can send notifications" on public.notifications
for insert to authenticated
with check (private.has_employee_role(array['admin','it','owner']));

drop policy if exists "active employees can mark notifications read" on public.notifications;
create policy "active employees can mark notifications read" on public.notifications
for update to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());
