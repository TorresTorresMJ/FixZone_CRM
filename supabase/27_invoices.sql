-- Contaduría: registro de facturas emitidas (a clientes) y recibidas
-- (gastos: insumos, herramientas, servicios como luz/internet, fin de mes, etc.)
-- Acceso: roles admin/it/owner, más excepción especial para Kevin Mijangos.

create or replace function private.is_admin_it_or_kevin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.employees
    where (auth_user_id = auth.uid() or lower(email) = private.current_user_email())
      and status = 'active'
      and (role = any(array['admin','it','owner']) or lower(full_name) = 'kevin mijangos')
  );
$$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  type text not null default 'Recibida' check (type in ('Emitida','Recibida')),
  status text not null default 'Pendiente' check (status in ('Pendiente','Facturado')),
  folio text,
  party_name text,
  party_rfc text,
  concept text,
  amount numeric(12,2) not null default 0,
  invoice_date date not null default current_date,
  transaction_id uuid references public.transactions(id) on delete set null,
  file_url text,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_branch_idx on public.invoices(branch_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_type_idx on public.invoices(type);

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

drop policy if exists "admin it kevin can view invoices" on public.invoices;
create policy "admin it kevin can view invoices" on public.invoices
for select to authenticated
using (private.is_admin_it_or_kevin());

drop policy if exists "admin it kevin can manage invoices" on public.invoices;
create policy "admin it kevin can manage invoices" on public.invoices
for all to authenticated
using (private.is_admin_it_or_kevin())
with check (private.is_admin_it_or_kevin());
