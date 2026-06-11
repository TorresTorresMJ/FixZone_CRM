-- Migration 26: Link supply_purchases -> transactions
-- Permite que editar o eliminar una compra de insumos sincronice (o borre)
-- la transacción de Egreso creada junto con ella.

alter table public.supply_purchases
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;
