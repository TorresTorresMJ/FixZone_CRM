-- DIAGNÓSTICO: corre estas queries en Supabase SQL Editor para ver qué está pasando.
-- Ejecuta como usuario autenticado (auth context) — puedes usar el SQL Editor
-- con la sesión de tu usuario logueado, O desde la consola del navegador con:
--   supabaseClient.rpc('diagnostico_it') si creas una función.
--
-- Más fácil: corre directamente en SQL Editor (como postgres/service role):

-- 1. Ver todas las políticas activas en service_tickets:
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'service_tickets'
order by policyname;

-- 2. Ver todas las políticas activas en products:
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'products'
order by policyname;

-- 3. Ver los roles de todos los empleados activos:
select id, full_name, email, role, status, auth_user_id
from public.employees
where status = 'active'
order by full_name;

-- 4. Ver función has_employee_role actual:
select prosrc
from pg_proc
where proname = 'has_employee_role'
  and pronamespace = (select oid from pg_namespace where nspname = 'private');
