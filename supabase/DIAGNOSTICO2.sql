-- Corre cada bloque por separado en el SQL Editor de Supabase

-- BLOQUE 1: Ver políticas activas en service_tickets
select policyname, cmd, with_check
from pg_policies
where schemaname = 'public' and tablename = 'service_tickets'
order by policyname;

-- ─────────────────────────────────────────────────────────────
-- BLOQUE 2: Ver roles exactos de empleados activos
select full_name, email, role, auth_user_id is not null as has_auth_link
from public.employees
where status = 'active'
order by full_name;
