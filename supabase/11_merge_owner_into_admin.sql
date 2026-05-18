-- Merge 'owner' into 'admin' — they have identical permissions.
-- After this, only admin/technician/marketing/sales/viewer remain as active roles.

update public.employees set role = 'admin' where role = 'owner';

-- Verify:
select role, count(*) from public.employees group by role order by role;
