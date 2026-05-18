-- Normalize all frontend roles to valid DB roles.
-- Frontend  →  DB role    →  Access level
--   it      →  owner      →  Full admin (all tables)
--   admin   →  admin      →  Full admin (no change needed)
--   standard→  technician →  Can manage tickets, customers, products, supplies
--   marketing→  technician →  Same write access as standard (no finance/users in UI)

update public.employees set role = 'owner'      where role = 'it';
update public.employees set role = 'technician'  where role = 'standard';
update public.employees set role = 'technician'  where role = 'marketing';
-- 'admin' stays as 'admin' — no change needed.

-- Verify:
select full_name, email, role from public.employees order by full_name;
