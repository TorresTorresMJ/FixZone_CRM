-- 43_pos_returns.sql
-- Devoluciones de ventas POS: pos_returns (cabecera) + pos_return_items (líneas)
-- Trigger: restaura stock de products al insertar una línea de devolución (inverso del trigger de 13_pos_tables.sql)

create table if not exists public.pos_returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  reason text,
  total_refunded numeric(12,2) not null default 0,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.pos_returns(id) on delete cascade,
  sale_item_id uuid references public.pos_sale_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

alter table public.pos_returns enable row level security;
alter table public.pos_return_items enable row level security;

-- Políticas pos_returns (incluye el rol 'it' desde el inicio — pos_sales/pos_sale_items
-- necesitaron un parche aparte en la migración 28 porque la 08 es anterior a la 13)
create policy "active employees can read pos returns"
  on public.pos_returns
  for select to authenticated
  using (private.is_active_employee());

create policy "active employees can insert pos returns"
  on public.pos_returns
  for insert to authenticated
  with check (private.has_employee_role(array['owner','admin','it','sales','technician']));

create policy "admins can manage pos returns"
  on public.pos_returns
  for all to authenticated
  using (private.has_employee_role(array['owner','admin','it']))
  with check (private.has_employee_role(array['owner','admin','it']));

-- Políticas pos_return_items
create policy "active employees can read pos return items"
  on public.pos_return_items
  for select to authenticated
  using (private.is_active_employee());

create policy "active employees can insert pos return items"
  on public.pos_return_items
  for insert to authenticated
  with check (private.is_active_employee());

create policy "admins can manage pos return items"
  on public.pos_return_items
  for all to authenticated
  using (private.has_employee_role(array['owner','admin','it']))
  with check (private.has_employee_role(array['owner','admin','it']));

-- Trigger: restaura stock del producto al agregar línea de devolución
create or replace function private.restore_stock_on_pos_return()
returns trigger language plpgsql security definer as $$
begin
  if new.product_id is not null then
    update public.products
      set stock = stock + new.quantity,
          updated_at = now()
    where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists pos_return_items_restore_stock on public.pos_return_items;
create trigger pos_return_items_restore_stock
  after insert on public.pos_return_items
  for each row execute function private.restore_stock_on_pos_return();

-- Índices
create index if not exists pos_returns_sale_idx on public.pos_returns (sale_id);
create index if not exists pos_return_items_return_idx on public.pos_return_items (return_id);
