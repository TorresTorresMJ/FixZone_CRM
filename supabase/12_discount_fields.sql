-- Add discount fields to service_tickets.
-- discount_code: the promo code applied (text, nullable)
-- discount_amount: fixed discount in MXN (default 0)
-- discount_pct: percentage discount 0-100 (default 0)
-- The effective repair price = repair_amount - discount_amount - (repair_amount * discount_pct / 100)

alter table public.service_tickets
  add column if not exists discount_code   text,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists discount_pct    numeric(5,2)  not null default 0;
