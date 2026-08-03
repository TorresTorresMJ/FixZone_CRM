-- Diagnóstico del hallazgo "tickets: paid_amount ≠ suma de Ingresos vinculados"
-- Solo lectura. Por cada ticket descuadrado muestra:
--   - paid_amount vs. lo sumado SOLO por ticket_id (linked_sum)
--   - cuánto dinero existe en transacciones SIN ticket_id pero cuyo concepto
--     menciona el folio del ticket (unlinked_sum_by_concept) — si esto explica
--     la diferencia, el dinero SÍ está en Finanzas, solo falta el enlace por FK.
--   - remainder: lo que seguiría sin explicarse después de sumar ambas fuentes
--     (si esto es 0 para casi todos, confirma la hipótesis; si no, hay que
--     mirar esos folios puntuales con más cuidado).

select
  t.tracking_number,
  t.paid_amount,
  coalesce((select sum(tr.amount) from public.transactions tr
            where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0) as linked_sum,
  (select count(*) from public.transactions tr2
   where tr2.ticket_id is null and tr2.type = 'Ingreso'
     and tr2.concept ilike '%' || t.tracking_number || '%') as unlinked_matches,
  coalesce((select sum(tr3.amount) from public.transactions tr3
            where tr3.ticket_id is null and tr3.type = 'Ingreso'
              and tr3.concept ilike '%' || t.tracking_number || '%'), 0) as unlinked_sum_by_concept,
  t.paid_amount
    - coalesce((select sum(tr.amount) from public.transactions tr
                where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0)
    - coalesce((select sum(tr3.amount) from public.transactions tr3
                where tr3.ticket_id is null and tr3.type = 'Ingreso'
                  and tr3.concept ilike '%' || t.tracking_number || '%'), 0) as remainder_sin_explicar
from public.service_tickets t
where t.stage <> 'Cancelado'
  and t.paid_amount <> coalesce((select sum(tr.amount) from public.transactions tr
                                  where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0)
order by abs(
  t.paid_amount
    - coalesce((select sum(tr.amount) from public.transactions tr
                where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0)
    - coalesce((select sum(tr3.amount) from public.transactions tr3
                where tr3.ticket_id is null and tr3.type = 'Ingreso'
                  and tr3.concept ilike '%' || t.tracking_number || '%'), 0)
) desc;
