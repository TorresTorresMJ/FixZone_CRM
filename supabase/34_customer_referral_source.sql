-- Migration 34: ¿Cómo nos conocieron? (fuente de referencia del cliente)
--
-- Agrega `how_found` y `how_found_other` a `customers` para registrar el
-- canal por el que un cliente nuevo llegó al negocio (Instagram, Facebook,
-- Transeúntes, Conocidos de Moni, Otro). `how_found_other` solo se usa
-- cuando how_found = 'Otro', para guardar la especificación libre.
--
-- No requiere cambios de RLS: las policies de `customers` ya cubren
-- columnas nuevas (no son column-scoped).

alter table public.customers
  add column if not exists how_found text,
  add column if not exists how_found_other text;
