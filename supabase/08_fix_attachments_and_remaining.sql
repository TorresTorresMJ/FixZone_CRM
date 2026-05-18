-- Fix 'it' role for attachments (photos) and any remaining tables not yet patched.
-- Additive policies with unique names — safe to run even if previous migrations ran.

drop policy if exists "it can manage attachments" on public.attachments;
create policy "it can manage attachments" on public.attachments
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- Remaining tables (idempotent — skip if already patched by migration 06)
drop policy if exists "it can manage branches" on public.branches;
create policy "it can manage branches" on public.branches
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage employees" on public.employees;
create policy "it can manage employees" on public.employees
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage customers" on public.customers;
create policy "it can manage customers" on public.customers
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage devices" on public.customer_devices;
create policy "it can manage devices" on public.customer_devices
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage products" on public.products;
create policy "it can manage products" on public.products
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage suppliers" on public.suppliers;
create policy "it can manage suppliers" on public.suppliers
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage purchases" on public.supply_purchases;
create policy "it can manage purchases" on public.supply_purchases
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage ticket events" on public.ticket_events;
create policy "it can manage ticket events" on public.ticket_events
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage ticket items" on public.ticket_items;
create policy "it can manage ticket items" on public.ticket_items
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage inventory movements" on public.inventory_movements;
create policy "it can manage inventory movements" on public.inventory_movements
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage transactions" on public.transactions;
create policy "it can manage transactions" on public.transactions
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can read audit log" on public.audit_log;
create policy "it can read audit log" on public.audit_log
for select to authenticated
using  (private.has_employee_role(array['it']));
