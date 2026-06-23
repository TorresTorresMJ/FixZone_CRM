-- Tabla genérica key/value para configuración que hoy vive en localStorage
-- (plantillas de WhatsApp, mensajes rápidos, links de marketing, config de precios, etc.).
-- Empezamos migrando solo las plantillas de WhatsApp (key='wa_templates'); el resto
-- de secciones se irán moviendo aquí de a una por sprint reusando la misma tabla.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.employees(id)
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "active employees can read app_settings" on public.app_settings;
create policy "active employees can read app_settings" on public.app_settings
for select to authenticated
using (private.is_active_employee());

drop policy if exists "active employees can manage app_settings" on public.app_settings;
create policy "active employees can manage app_settings" on public.app_settings
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());
