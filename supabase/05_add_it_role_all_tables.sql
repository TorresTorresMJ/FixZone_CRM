-- Add 'it' to every write policy that currently excludes it.
-- The 'it' role is the frontend IT-admin role stored directly in employees.role
-- for users created via the Edge Function. It must have the same access as 'owner'/'admin'.
--
-- Run this ONCE in the Supabase SQL editor.
-- Safe to re-run: every statement uses DROP IF EXISTS before recreating.

-- ── branches ─────────────────────────────────────────────────────────────────
drop policy if exists "admins can manage branches" on public.branches;
create policy "admins can manage branches" on public.branches
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── employees ────────────────────────────────────────────────────────────────
drop policy if exists "owners and admins can manage employees" on public.employees;
create policy "owners and admins can manage employees" on public.employees
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── customers ────────────────────────────────────────────────────────────────
drop policy if exists "sales staff can manage customers" on public.customers;
create policy "sales staff can manage customers" on public.customers
for insert to authenticated
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

drop policy if exists "sales staff can update customers" on public.customers;
create policy "sales staff can update customers" on public.customers
for update to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

drop policy if exists "admins can delete customers" on public.customers;
create policy "admins can delete customers" on public.customers
for delete to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── customer_devices ─────────────────────────────────────────────────────────
drop policy if exists "active employees can manage devices" on public.customer_devices;
create policy "active employees can manage devices" on public.customer_devices
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

-- ── products ─────────────────────────────────────────────────────────────────
drop policy if exists "admins can manage products" on public.products;
create policy "admins can manage products" on public.products
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── suppliers ────────────────────────────────────────────────────────────────
drop policy if exists "admins can manage suppliers" on public.suppliers;
create policy "admins can manage suppliers" on public.suppliers
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── supply_purchases ─────────────────────────────────────────────────────────
drop policy if exists "admins can manage purchases" on public.supply_purchases;
create policy "admins can manage purchases" on public.supply_purchases
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── service_tickets ──────────────────────────────────────────────────────────
drop policy if exists "staff can create tickets" on public.service_tickets;
create policy "staff can create tickets" on public.service_tickets
for insert to authenticated
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

drop policy if exists "staff can update tickets" on public.service_tickets;
create policy "staff can update tickets" on public.service_tickets
for update to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

drop policy if exists "admins can delete tickets" on public.service_tickets;
create policy "admins can delete tickets" on public.service_tickets
for delete to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── ticket_events ────────────────────────────────────────────────────────────
drop policy if exists "active employees can manage ticket events" on public.ticket_events;
create policy "active employees can manage ticket events" on public.ticket_events
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

-- ── ticket_items ─────────────────────────────────────────────────────────────
drop policy if exists "active employees can manage ticket items" on public.ticket_items;
create policy "active employees can manage ticket items" on public.ticket_items
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

-- ── inventory_movements ──────────────────────────────────────────────────────
drop policy if exists "admins can manage inventory movements" on public.inventory_movements;
create policy "admins can manage inventory movements" on public.inventory_movements
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'it']));

-- ── transactions (already fixed in 03, kept here for completeness) ────────────
drop policy if exists "admins and sales can manage transactions" on public.transactions;
create policy "admins and sales can manage transactions" on public.transactions
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'it']));

-- ── attachments ──────────────────────────────────────────────────────────────
drop policy if exists "active employees can manage attachments" on public.attachments;
create policy "active employees can manage attachments" on public.attachments
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

-- ── audit_log ────────────────────────────────────────────────────────────────
drop policy if exists "admins can read audit log" on public.audit_log;
create policy "admins can read audit log" on public.audit_log
for select to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'it']));
