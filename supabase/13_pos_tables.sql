-- 13_pos_tables.sql
-- Punto de Venta: tablas pos_sales y pos_sale_items
-- pos_sales: cabecera de cada venta (un registro por checkout)
-- pos_sale_items: líneas de venta (productos vendidos por venta)
-- Trigger: decrementa stock de products al insertar una línea de venta

create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  payment_method text not null default 'Efectivo',
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;

-- Políticas pos_sales
create policy "active employees can read pos sales"
  on public.pos_sales
  for select to authenticated
  using (private.is_active_employee());

create policy "active employees can insert pos sales"
  on public.pos_sales
  for insert to authenticated
  with check (private.has_employee_role(array['owner','admin','sales','technician']));

create policy "admins can manage pos sales"
  on public.pos_sales
  for all to authenticated
  using (private.has_employee_role(array['owner','admin']))
  with check (private.has_employee_role(array['owner','admin']));

-- Políticas pos_sale_items
create policy "active employees can read pos sale items"
  on public.pos_sale_items
  for select to authenticated
  using (private.is_active_employee());

create policy "active employees can insert pos sale items"
  on public.pos_sale_items
  for insert to authenticated
  with check (private.is_active_employee());

create policy "admins can manage pos sale items"
  on public.pos_sale_items
  for all to authenticated
  using (private.has_employee_role(array['owner','admin']))
  with check (private.has_employee_role(array['owner','admin']));

-- Trigger: decrementa stock del producto al agregar línea de venta
create or replace function private.decrement_stock_on_pos_sale()
returns trigger language plpgsql security definer as $$
begin
  if new.product_id is not null then
    update public.products
      set stock = stock - new.quantity,
          updated_at = now()
    where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists pos_sale_items_decrement_stock on public.pos_sale_items;
create trigger pos_sale_items_decrement_stock
  after insert on public.pos_sale_items
  for each row execute function private.decrement_stock_on_pos_sale();

-- Índices
create index if not exists pos_sales_branch_idx on public.pos_sales (branch_id);
create index if not exists pos_sale_items_sale_idx on public.pos_sale_items (sale_id);
