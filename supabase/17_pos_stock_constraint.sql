-- Migration 17: prevent negative stock on products
-- Adds a CHECK constraint so no sale (POS trigger or manual update) can
-- push stock below zero. Apply in Supabase SQL Editor.

ALTER TABLE public.products
  ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);
