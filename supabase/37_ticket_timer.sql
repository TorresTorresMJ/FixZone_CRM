-- Migration 37: Cronómetro opcional en tickets
--
-- Agrega timer_target_at a service_tickets para marcar "listo en X horas" desde
-- la tarjeta del ticket. La tarjeta muestra una cuenta regresiva en vivo y, al
-- vencer, sigue contando el tiempo de retraso en rojo.

alter table public.service_tickets
  add column if not exists timer_target_at timestamptz;