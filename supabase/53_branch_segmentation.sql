-- 53_branch_segmentation.sql
-- Segmentación real por sucursal (Puerto Vallarta / Puebla), enforced a nivel RLS,
-- no solo en el filtro de UI (branchTickets()/branchClients()/etc, que es permisivo
-- y nunca fue una barrera de seguridad real). A partir de esta migración:
--   - Cada empleado tiene una sucursal asignada (employees.branch_id).
--   - Un empleado normal solo puede leer/escribir filas de SU sucursal.
--   - employees.all_branches_access = true da acceso a ambas sucursales (solo Monica).
-- Estrategia: políticas RESTRICTIVE (se combinan con AND sobre las políticas
-- existentes) en vez de reescribir las ~40 políticas permisivas ya existentes por
-- rol/feature — esto es puramente aditivo, cero riesgo de romper una política
-- existente por error de transcripción.

-- ── 1. Nueva columna: acceso a todas las sucursales ────────────────────────────
alter table public.employees
  add column if not exists all_branches_access boolean not null default false;

-- ── 2. Asignar sucursal a los empleados actuales ────────────────────────────────
update public.employees
set branch_id = (select id from public.branches where name = 'Puerto Vallarta'),
    default_branch_id = coalesce(default_branch_id, (select id from public.branches where name = 'Puerto Vallarta'))
where lower(full_name) = 'kevin mijangos';

update public.employees
set branch_id = (select id from public.branches where name = 'Puebla'),
    default_branch_id = coalesce(default_branch_id, (select id from public.branches where name = 'Puebla'))
where lower(full_name) in ('carlos mijangos', 'daniel mijangos', 'diego mijangos', 'gigi vargas', 'mar');

update public.employees
set branch_id = (select id from public.branches where name = 'Puerto Vallarta'),
    default_branch_id = coalesce(default_branch_id, (select id from public.branches where name = 'Puerto Vallarta')),
    all_branches_access = true
where lower(full_name) = 'monica torres';

-- ── 3. Backfill de registros huérfanos (branch_id null) hacia Puerto Vallarta ──
-- (única sucursal operando hasta ahora; ver auditoría previa a esta migración —
-- todo lo existente ya tenía branch_id salvo 2 transacciones sueltas)
update public.transactions set branch_id = (select id from public.branches where name = 'Puerto Vallarta') where branch_id is null;

-- ── 4. Funciones helper (private schema, security definer) ────────────────────
create or replace function private.employee_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public, private
as $$
  select branch_id
  from public.employees
  where (auth_user_id = auth.uid() or lower(email) = private.current_user_email())
    and status = 'active'
  limit 1;
$$;

create or replace function private.employee_all_branches_access()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(bool_or(all_branches_access), false)
  from public.employees
  where (auth_user_id = auth.uid() or lower(email) = private.current_user_email())
    and status = 'active';
$$;

-- Lectura: visible si tiene acceso a todas las sucursales, si la fila no tiene
-- sucursal asignada (null = compartido/huérfano, mismo criterio que branchXxx()
-- en el frontend), o si coincide con la sucursal del empleado.
create or replace function private.can_read_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.employee_all_branches_access()
     or target_branch_id is null
     or target_branch_id = private.employee_branch_id();
$$;

-- Escritura: más estricta que la lectura — un empleado sin acceso global nunca
-- puede crear/editar una fila marcándola como null o de otra sucursal. Solo para
-- tablas donde branch_id se guarda directo y el frontend siempre manda un valor real.
create or replace function private.can_write_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.employee_all_branches_access()
     or target_branch_id = private.employee_branch_id();
$$;

-- ── 5. Políticas RESTRICTIVE — tablas con branch_id propio y siempre poblado ──
-- (customers, products, supply_purchases, service_tickets, transactions,
--  inventory_movements, invoices, pos_sales, pos_returns, discount_codes,
--  service_prices, team_tasks, brand_assets)
do $$
declare
  t text;
  tables text[] := array[
    'customers', 'products', 'supply_purchases', 'service_tickets', 'transactions',
    'inventory_movements', 'invoices', 'pos_sales', 'pos_returns', 'discount_codes',
    'service_prices', 'team_tasks', 'brand_assets'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "branch isolation" on public.%I', t);
    execute format($f$
      create policy "branch isolation" on public.%I
      as restrictive
      for all
      to authenticated
      using (private.can_read_branch(branch_id))
      with check (private.can_write_branch(branch_id))
    $f$, t);
  end loop;
end $$;

-- ── 6. notifications — solo restringe LECTURA, no escritura ───────────────────
-- branch_id en notifications tiene doble uso: filtra broadcasts por sucursal (sí
-- debe segmentarse) pero la mayoría de notificaciones son dirigidas a un
-- recipient_id puntual (asignación de ticket, comentarios, etc.) con branch_id
-- null por default — restringir el INSERT ahí rompería ese flujo para cualquier
-- empleado sin all_branches_access. Con can_read_branch (null = visible a todos)
-- un broadcast sin sucursal sigue llegando a todo el equipo como hasta ahora, y
-- un broadcast con sucursal explícita ahora sí queda contenido a esa sucursal.
drop policy if exists "branch isolation" on public.notifications;
create policy "branch isolation" on public.notifications
as restrictive
for select
to authenticated
using (private.can_read_branch(branch_id));

-- ── 7. employees — visible/editable dentro de la propia sucursal, + uno mismo ─
drop policy if exists "branch isolation" on public.employees;
create policy "branch isolation" on public.employees
as restrictive
for all
to authenticated
using (private.can_read_branch(branch_id) or auth_user_id = auth.uid())
with check (private.can_write_branch(branch_id) or auth_user_id = auth.uid());

-- ── 8. Tablas hijas sin branch_id propio — se deriva del padre ─────────────────
-- Mismo criterio permisivo en lectura Y escritura (can_read_branch, no
-- can_write_branch) porque el padre puede legítimamente no tener sucursal
-- resuelta en casos borde (ej. ticket walk-in sin cliente) y no queremos
-- bloquear la operación normal por eso — el caso real (padre con sucursal
-- definida) sigue quedando completamente aislado.
drop policy if exists "branch isolation" on public.customer_devices;
create policy "branch isolation" on public.customer_devices
as restrictive
for all
to authenticated
using (private.can_read_branch((select c.branch_id from public.customers c where c.id = customer_devices.customer_id)))
with check (private.can_read_branch((select c.branch_id from public.customers c where c.id = customer_devices.customer_id)));

drop policy if exists "branch isolation" on public.attachments;
create policy "branch isolation" on public.attachments
as restrictive
for all
to authenticated
using (private.can_read_branch(coalesce(
  (select t.branch_id from public.service_tickets t where t.id = attachments.ticket_id),
  (select c.branch_id from public.customers c where c.id = attachments.customer_id)
)))
with check (private.can_read_branch(coalesce(
  (select t.branch_id from public.service_tickets t where t.id = attachments.ticket_id),
  (select c.branch_id from public.customers c where c.id = attachments.customer_id)
)));

drop policy if exists "branch isolation" on public.ticket_events;
create policy "branch isolation" on public.ticket_events
as restrictive
for all
to authenticated
using (private.can_read_branch((select t.branch_id from public.service_tickets t where t.id = ticket_events.ticket_id)))
with check (private.can_read_branch((select t.branch_id from public.service_tickets t where t.id = ticket_events.ticket_id)));

drop policy if exists "branch isolation" on public.ticket_items;
create policy "branch isolation" on public.ticket_items
as restrictive
for all
to authenticated
using (private.can_read_branch((select t.branch_id from public.service_tickets t where t.id = ticket_items.ticket_id)))
with check (private.can_read_branch((select t.branch_id from public.service_tickets t where t.id = ticket_items.ticket_id)));

drop policy if exists "branch isolation" on public.pos_sale_items;
create policy "branch isolation" on public.pos_sale_items
as restrictive
for all
to authenticated
using (private.can_read_branch((select s.branch_id from public.pos_sales s where s.id = pos_sale_items.sale_id)))
with check (private.can_read_branch((select s.branch_id from public.pos_sales s where s.id = pos_sale_items.sale_id)));

drop policy if exists "branch isolation" on public.pos_return_items;
create policy "branch isolation" on public.pos_return_items
as restrictive
for all
to authenticated
using (private.can_read_branch((select r.branch_id from public.pos_returns r where r.id = pos_return_items.return_id)))
with check (private.can_read_branch((select r.branch_id from public.pos_returns r where r.id = pos_return_items.return_id)));

-- Nota deliberada: suppliers, service_types, app_settings, support_tasks y
-- support_task_comments quedan SIN restricción de sucursal — son catálogos
-- globales (proveedores, tipos de servicio, plantillas de WhatsApp) o soporte
-- IT interno, que por diseño no está segmentado por sucursal (Monica hace IT
-- para ambas). audit_log tampoco se toca (solo lectura admin, no listado normal).
