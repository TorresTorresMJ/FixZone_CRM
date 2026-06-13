-- Migration 30: Brand asset library (tab Diseño)
-- Repositorio de archivos de marca (logos en variantes, íconos, etc.) separado
-- del "Editor de marca" — solo almacena/lista archivos, no afecta el branding
-- activo del CRM (favicon, sidebar, login).

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id), -- null = compartido entre ambas marcas
  label text not null,
  category text not null default 'Otro', -- 'Logo color' | 'Logo monocromático' | 'Logo sin fondo' | 'Logo negro' | 'Ícono' | 'Otro'
  file_url text not null,
  file_name text,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now()
);

create index if not exists brand_assets_branch_idx on public.brand_assets(branch_id);

alter table public.brand_assets enable row level security;

drop policy if exists "active employees can view brand assets" on public.brand_assets;
create policy "active employees can view brand assets" on public.brand_assets
for select to authenticated
using (private.is_active_employee());

drop policy if exists "active employees can manage brand assets" on public.brand_assets;
create policy "active employees can manage brand assets" on public.brand_assets
for all to authenticated
using (private.is_active_employee())
with check (private.is_active_employee());
