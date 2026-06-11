-- Migration 24: Add payment_method column to service_tickets
-- Tracks how each ticket was paid (Efectivo, Transferencia, Terminal TC, etc.)
-- for internal reporting and traceability without joining transactions.

alter table public.service_tickets
  add column if not exists payment_method text;
