-- 55_suppliers_branch.sql
-- Segmenta `suppliers` por sucursal — quedó fuera de la migración 53 a
-- propósito en ese momento (se trató como catálogo global, como
-- `service_types`), pero Puebla y Vallarta no comparten proveedores reales,
-- así que corresponde el mismo aislamiento que el resto de las tablas de
-- negocio.

alter table public.suppliers
  add column if not exists branch_id uuid references public.branches(id);

-- Los 11 proveedores existentes se dieron de alta operando solo Puerto
-- Vallarta — quedan ahí (mismo criterio que el resto del backfill de la
-- migración 53).
update public.suppliers set branch_id = (select id from public.branches where name = 'Puerto Vallarta') where branch_id is null;

create index if not exists suppliers_branch_idx on public.suppliers (branch_id);

drop policy if exists "branch isolation" on public.suppliers;
create policy "branch isolation" on public.suppliers
as restrictive
for all
to authenticated
using (private.can_read_branch(branch_id))
with check (private.can_write_branch(branch_id));
