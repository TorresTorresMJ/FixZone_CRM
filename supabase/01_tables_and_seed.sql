-- FixZone CRM initial Supabase schema
-- Project: FixZone / zwmffnrkrrowmchluyyy

create extension if not exists pgcrypto;

create schema if not exists private;

create sequence if not exists public.ticket_tracking_seq start 1;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  state text,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  role text not null default 'technician' check (role in ('owner', 'admin', 'technician', 'sales', 'viewer')),
  status text not null default 'active' check (status in ('active', 'paused', 'terminated')),
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  notes text,
  branch_id uuid references public.branches(id) on delete set null,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_name text not null,
  brand text,
  model text,
  serial_number text,
  imei text,
  color text,
  accessories_received text,
  physical_condition text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  category text not null default 'Refaccion',
  product_type text not null default 'refaccion' check (product_type in ('producto', 'refaccion', 'insumo')),
  stock numeric(12, 2) not null default 0,
  min_stock numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supply_purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  purchase_date date not null default current_date,
  item_name text not null,
  quantity numeric(12, 2) not null default 1,
  total_amount numeric(12, 2) not null default 0,
  receipt_url text,
  notes text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique default ('[FZ] ' || lpad(nextval('public.ticket_tracking_seq')::text, 4, '0')),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  device_id uuid references public.customer_devices(id) on delete set null,
  product_name text not null,
  issue_description text not null,
  stage text not null default 'Recibido' check (stage in ('Cotizacion', 'Recibido', 'En reparacion', 'Listo', 'Entregado', 'Garantia')),
  priority text not null default 'Normal' check (priority in ('Normal', 'Media', 'Alta', 'Urgente')),
  repair_amount numeric(12, 2) not null default 0,
  payment_status text not null default 'Pendiente' check (payment_status in ('Pendiente', 'Abonado', 'Pagado')),
  paid_amount numeric(12, 2) not null default 0,
  branch_id uuid references public.branches(id) on delete set null,
  assigned_employee_id uuid references public.employees(id) on delete set null,
  received_at timestamptz not null default now(),
  delivered_at timestamptz,
  warranty_until date,
  notes text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.service_tickets(id) on delete cascade,
  event_type text not null,
  from_stage text,
  to_stage text,
  note text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_items (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.service_tickets(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  line_total numeric(12, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  movement_type text not null check (movement_type in ('entrada', 'salida', 'ajuste', 'merma')),
  quantity numeric(12, 2) not null,
  related_ticket_id uuid references public.service_tickets(id) on delete set null,
  related_purchase_id uuid references public.supply_purchases(id) on delete set null,
  note text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  ticket_id uuid references public.service_tickets(id) on delete set null,
  transaction_date date not null default current_date,
  type text not null check (type in ('Ingreso', 'Egreso')),
  concept text not null,
  category text not null,
  amount numeric(12, 2) not null default 0,
  payment_method text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.service_tickets(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  file_url text not null,
  file_type text,
  label text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_employee_id uuid references public.employees(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
insert into public.branches (name, city, state)
values
  ('Puerto Vallarta', 'Puerto Vallarta', 'Jalisco'),
  ('Puebla', 'Puebla', 'Puebla')
on conflict (name) do nothing;

-- Replace the placeholder emails before running this block in production.
insert into public.employees (full_name, email, role, status, branch_id)
values
  ('Kevin Mijangos', 'kevin@example.com', 'technician', 'active', (select id from public.branches where name = 'Puerto Vallarta')),
  ('Carlos Mijangos', 'carlos@example.com', 'admin', 'active', (select id from public.branches where name = 'Puebla')),
  ('Gigi Vargas', 'gigi@example.com', 'sales', 'active', (select id from public.branches where name = 'Puerto Vallarta')),
  ('Monica Torres', 'monica@example.com', 'owner', 'active', (select id from public.branches where name = 'Puerto Vallarta')),
  ('Diego Mijangos', 'diego@example.com', 'technician', 'active', (select id from public.branches where name = 'Puebla')),
  ('Daniel Mijangos', 'daniel@example.com', 'technician', 'active', (select id from public.branches where name = 'Puebla'))
on conflict (email) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status,
  branch_id = excluded.branch_id;
