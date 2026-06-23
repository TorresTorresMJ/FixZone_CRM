-- Reemplaza la excepción de Contaduría hardcodeada por nombre ("Kevin Mijangos")
-- por un flag explícito en employees, editable por admin/it sin tocar código.

alter table public.employees
  add column if not exists can_access_contaduria boolean not null default false;

-- Backfill: preservar el acceso que Kevin ya tenía por la regla anterior.
update public.employees
set can_access_contaduria = true
where lower(full_name) = 'kevin mijangos';

create or replace function private.is_admin_it_or_kevin()
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
      and (role = any(array['admin','it','owner']) or can_access_contaduria)
  );
$$;
