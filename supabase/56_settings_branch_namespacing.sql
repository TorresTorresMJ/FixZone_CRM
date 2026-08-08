-- 56_settings_branch_namespacing.sql
-- Plantillas de WhatsApp y mensajes rápidos (app_settings) pasan de una sola
-- key compartida entre sucursales a una key por sucursal
-- (`wa_templates:<Sucursal>`, `quick_messages:<Sucursal>`) — un mensaje o
-- plantilla creado/editado/borrado en Puebla ya no toca el de Vallarta, y
-- viceversa. La migración de datos (copiar el contenido compartido como
-- punto de partida de cada sucursal, quitar el mensaje "Transferencia" del
-- set de Puebla por no corresponderle, y borrar las keys viejas) se hizo a
-- mano vía SQL — no hay nada que repetir aquí, este archivo documenta y
-- aplica solo la parte de RLS.
--
-- app_settings no tenía ninguna restricción por sucursal (ni siquiera la
-- permisiva de frontend) — cualquier empleado activo podía leer/escribir
-- cualquier key vía API sin pasar por la UI. Con el namespacing por key,
-- ahora si se puede: cualquier key con sufijo ":<Sucursal>" reconocible
-- queda restringida a esa sucursal (o a all_branches_access); las keys sin
-- sufijo (config verdaderamente compartida, ej. futuras) siguen abiertas a
-- cualquier empleado activo, igual que antes.

drop policy if exists "branch isolation" on public.app_settings;
create policy "branch isolation" on public.app_settings
as restrictive
for all
to authenticated
using (
  private.employee_all_branches_access()
  or position(':' in key) = 0
  or split_part(key, ':', 2) = (select b.name from public.branches b where b.id = private.employee_branch_id())
)
with check (
  private.employee_all_branches_access()
  or position(':' in key) = 0
  or split_part(key, ':', 2) = (select b.name from public.branches b where b.id = private.employee_branch_id())
);
