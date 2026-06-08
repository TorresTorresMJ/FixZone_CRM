-- migration 25: add receipt_url to transactions
-- Allows attaching a scanned comprobante (photo/PDF) to any Egreso transaction.

alter table public.transactions
  add column if not exists receipt_url text;
