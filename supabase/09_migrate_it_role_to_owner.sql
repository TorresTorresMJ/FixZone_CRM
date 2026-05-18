-- Permanent fix: rename the 'it' frontend role to 'owner' in the employees table.
-- 'it' was used by the Edge Function but is not a recognized DB role in any RLS policy.
-- 'owner' is the DB equivalent — full access, already allowed in all policies.
--
-- After running this, the additive "it can manage *" policies from migration 08
-- are no longer needed (but they don't hurt if left in place).

update public.employees
set role = 'owner'
where role = 'it';

-- Verify result:
select full_name, email, role from public.employees order by full_name;
