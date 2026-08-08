-- 52_login_pin.sql
-- Agrega employees.login_pin_hash — PIN numérico opcional (4-6 dígitos) que un
-- empleado puede usar como credencial alterna a su contraseña alfanumérica.
-- Se guarda hasheado (SHA-256), nunca en texto plano; el hash y la verificación
-- viven exclusivamente en la Edge Function pública `self-service-auth`
-- (service-role key, nunca expuesta al navegador).
--
-- No lleva RLS propia porque nunca se lee/escribe desde el cliente con su
-- sesión normal (ni siquiera el propio empleado autenticado la toca vía
-- supabase-js) — solo la Edge Function, que usa el service-role client y por
-- lo tanto se salta RLS.

alter table public.employees
  add column if not exists login_pin_hash text;

comment on column public.employees.login_pin_hash is
  'Hash SHA-256 del PIN numérico opcional de login (credencial alterna a la contraseña). Solo lo escribe/lee la Edge Function self-service-auth.';
