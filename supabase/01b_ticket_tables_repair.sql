-- FixZone repair script: create ticket and operational tables if step 1 was only partially executed.

create sequence if not exists public.ticket_tracking_seq start 1;

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
  created_at timestamptz not null default now()
);
