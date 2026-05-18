-- Additive RLS policies for the 'it' role.
-- Instead of replacing existing policies (which can fail if names differ),
-- this adds NEW permissive policies for 'it'. With permissive RLS, an operation
-- succeeds if ANY policy allows it — so existing policies stay intact and 'it'
-- gets access via these additional policies.
--
-- Safe to re-run: uses DROP IF EXISTS before each CREATE.

-- branches
drop policy if exists "it can manage branches" on public.branches;
create policy "it can manage branches" on public.branches
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- employees
drop policy if exists "it can manage employees" on public.employees;
create policy "it can manage employees" on public.employees
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- customers
drop policy if exists "it can manage customers" on public.customers;
create policy "it can manage customers" on public.customers
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- customer_devices
drop policy if exists "it can manage devices" on public.customer_devices;
create policy "it can manage devices" on public.customer_devices
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- products
drop policy if exists "it can manage products" on public.products;
create policy "it can manage products" on public.products
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- suppliers
drop policy if exists "it can manage suppliers" on public.suppliers;
create policy "it can manage suppliers" on public.suppliers
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- supply_purchases
drop policy if exists "it can manage purchases" on public.supply_purchases;
create policy "it can manage purchases" on public.supply_purchases
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- service_tickets
drop policy if exists "it can manage tickets" on public.service_tickets;
create policy "it can manage tickets" on public.service_tickets
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- ticket_events
drop policy if exists "it can manage ticket events" on public.ticket_events;
create policy "it can manage ticket events" on public.ticket_events
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- ticket_items
drop policy if exists "it can manage ticket items" on public.ticket_items;
create policy "it can manage ticket items" on public.ticket_items
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- inventory_movements
drop policy if exists "it can manage inventory movements" on public.inventory_movements;
create policy "it can manage inventory movements" on public.inventory_movements
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- transactions
drop policy if exists "it can manage transactions" on public.transactions;
create policy "it can manage transactions" on public.transactions
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- attachments
drop policy if exists "it can manage attachments" on public.attachments;
create policy "it can manage attachments" on public.attachments
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

-- audit_log
drop policy if exists "it can read audit log" on public.audit_log;
create policy "it can read audit log" on public.audit_log
for select to authenticated
using  (private.has_employee_role(array['it']));
