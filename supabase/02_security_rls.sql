create or replace function private.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function private.is_active_employee()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.employees
    where lower(email) = private.current_user_email()
      and status = 'active'
  );
$$;

create or replace function private.has_employee_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.employees
    where lower(email) = private.current_user_email()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create index if not exists employees_email_idx on public.employees (lower(email));
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customer_devices_imei_idx on public.customer_devices (imei);
create index if not exists products_sku_idx on public.products (sku);
create index if not exists tickets_tracking_idx on public.service_tickets (tracking_number);
create index if not exists tickets_stage_idx on public.service_tickets (stage);
create index if not exists transactions_date_idx on public.transactions (transaction_date);

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_devices_updated_at on public.customer_devices;
create trigger set_customer_devices_updated_at before update on public.customer_devices
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_supply_purchases_updated_at on public.supply_purchases;
create trigger set_supply_purchases_updated_at before update on public.supply_purchases
for each row execute function public.set_updated_at();

drop trigger if exists set_service_tickets_updated_at on public.service_tickets;
create trigger set_service_tickets_updated_at before update on public.service_tickets
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

alter table public.branches enable row level security;
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.customer_devices enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.supply_purchases enable row level security;
alter table public.service_tickets enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.transactions enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_log enable row level security;

create policy "active employees can read branches" on public.branches
for select to authenticated using (private.is_active_employee());

create policy "admins can manage branches" on public.branches
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read employees" on public.employees
for select to authenticated using (private.is_active_employee());

create policy "owners and admins can manage employees" on public.employees
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read customers" on public.customers
for select to authenticated using (private.is_active_employee());

create policy "sales staff can manage customers" on public.customers
for insert to authenticated with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "sales staff can update customers" on public.customers
for update to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "admins can delete customers" on public.customers
for delete to authenticated using (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can manage devices" on public.customer_devices
for all to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "active employees can read products" on public.products
for select to authenticated using (private.is_active_employee());

create policy "admins can manage products" on public.products
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read suppliers" on public.suppliers
for select to authenticated using (private.is_active_employee());

create policy "admins can manage suppliers" on public.suppliers
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read purchases" on public.supply_purchases
for select to authenticated using (private.is_active_employee());

create policy "admins can manage purchases" on public.supply_purchases
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read tickets" on public.service_tickets
for select to authenticated using (private.is_active_employee());

create policy "staff can create tickets" on public.service_tickets
for insert to authenticated with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "staff can update tickets" on public.service_tickets
for update to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "admins can delete tickets" on public.service_tickets
for delete to authenticated using (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can manage ticket events" on public.ticket_events
for all to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "active employees can manage ticket items" on public.ticket_items
for all to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "active employees can read inventory movements" on public.inventory_movements
for select to authenticated using (private.is_active_employee());

create policy "admins can manage inventory movements" on public.inventory_movements
for all to authenticated using (private.has_employee_role(array['owner', 'admin']))
with check (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can read transactions" on public.transactions
for select to authenticated using (private.is_active_employee());

create policy "admins and sales can manage transactions" on public.transactions
for all to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales']))
with check (private.has_employee_role(array['owner', 'admin', 'sales']));

create policy "active employees can manage attachments" on public.attachments
for all to authenticated using (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician']));

create policy "admins can read audit log" on public.audit_log
for select to authenticated using (private.has_employee_role(array['owner', 'admin']));

create policy "active employees can insert audit log" on public.audit_log
for insert to authenticated with check (private.is_active_employee());

