-- 54_notifications_write_isolation.sql
-- Completa la segmentación de `notifications` (migración 53 solo restringía
-- SELECT, a propósito: en ese momento el frontend no etiquetaba de forma
-- confiable cada aviso con una sucursal real — la mayoría de las llamadas a
-- addNotif() mandaban branch_id: null por default). Ya se corrigió el
-- frontend para que los 6 puntos donde se crea un aviso (asignación de
-- ticket, cambio de etapa, respuesta de soporte, aviso al equipo) manden
-- siempre una sucursal real, así que ahora sí se puede exigir también en la
-- escritura, igual que en el resto de las tablas — sin este paso, un
-- broadcast o aviso dirigido podía insertarse marcado con la sucursal de
-- otra persona (o sin sucursal) sin que nada lo evitara del lado del server.
--
-- `team_tasks` no necesita nada aquí: ya tenía la política restrictiva
-- completa (lectura + escritura) desde la migración 53, y addTeamTask()
-- siempre mandó una sucursal real desde antes.

-- Los 2 avisos que ya existían se crearon durante la operación de Puerto
-- Vallarta (única sucursal activa hasta ahora) — quedan etiquetados ahí.
update public.notifications set branch_id = (select id from public.branches where name = 'Puerto Vallarta') where branch_id is null;

drop policy if exists "branch isolation" on public.notifications;
create policy "branch isolation" on public.notifications
as restrictive
for all
to authenticated
using (private.can_read_branch(branch_id))
with check (private.can_write_branch(branch_id));
