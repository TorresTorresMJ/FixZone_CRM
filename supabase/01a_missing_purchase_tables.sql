-- FixZone repair script: create purchase tables required by later operational tables.

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
