-- Restringe Contaduría exclusivamente a Kevin Mijangos y Monica Torres.
-- Antes: cualquier empleado con rol admin/it/owner tenía acceso automático,
-- más la excepción individual `can_access_contaduria`. Ahora el rol ya no
-- concede acceso por sí solo -- todo pasa por el flag `can_access_contaduria`,
-- que queda encendido únicamente para Kevin y Monica por defecto (y sigue
-- siendo editable por admin/it desde Usuarios para dar/quitar acceso a
-- alguien más si algún día se pide explícitamente).

update public.employees
set can_access_contaduria = (lower(full_name) in ('kevin mijangos', 'monica torres'));

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
      and can_access_contaduria
  );
$$;
