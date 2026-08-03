-- Diagnóstico puntual: ¿las transacciones de [FZ] 0092 (y de los otros 4 tickets
-- con descuadre sin explicar) están separadas por segundos (fingerprint de un
-- doble-submit) o por horas/días (dos abonos legítimos, ej. mitad y luego el
-- resto por la misma cantidad)? Solo lectura.

select
  t.tracking_number,
  tr.id            as transaction_id,
  tr.type,
  tr.amount,
  tr.concept,
  tr.payment_method,
  tr.ticket_id     as linked_directly,
  tr.created_at,
  tr.created_at - lag(tr.created_at) over (partition by t.tracking_number order by tr.created_at) as gap_desde_anterior
from public.service_tickets t
join public.transactions tr
  on tr.type = 'Ingreso'
 and (tr.ticket_id = t.id or tr.concept ilike '%' || t.tracking_number || '%')
where t.tracking_number in ('[FZ] 0080', '[FZ] 0092', '[FZ] 0099', '[FZ] 0036', '[FZ] 0053')
order by t.tracking_number, tr.created_at;
