-- Fix RLS helper functions to match by auth_user_id OR email (whichever is set).
-- This resolves: "violates row-level security" on transactions and empty ticket reads
-- that happen when employees.email doesn't match auth.jwt() ->> 'email'.

create or replace function private.is_active_employee()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.employees
    where (auth_user_id = auth.uid() or lower(email) = private.current_user_email())
      and status = 'active'
  );
$$;

create or replace function private.has_employee_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.employees
    where (auth_user_id = auth.uid() or lower(email) = private.current_user_email())
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

-- Expand transactions write policy to also allow the 'it' frontend role that some
-- employees may have stored in their DB record (created before the role constraint).
drop policy if exists "admins and sales can manage transactions" on public.transactions;
create policy "admins and sales can manage transactions" on public.transactions
for all to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'it']));
