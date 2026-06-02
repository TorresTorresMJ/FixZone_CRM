-- Backfill: crear transacciones de Ingreso para tickets con paid_amount > 0
-- que no tienen (o tienen menos de lo esperado) en la tabla transactions.
--
-- Lógica segura:
--   gap = ticket.paid_amount  −  SUM(transacciones ya registradas para ese folio)
--   Si gap > 0 → insertar la diferencia (evita duplicar abonos que sí se guardaron)
--
-- Aplica a TODAS las sucursales (Puerto Vallarta y Puebla).
-- La columna branch_id viene del propio ticket, por lo que cada ingreso
-- queda asignado a la sucursal correcta.

WITH ticket_tx_sums AS (
  SELECT
    st.id                                                        AS ticket_id,
    st.tracking_number,
    st.branch_id,
    st.paid_amount,
    COALESCE(st.received_at::date, st.created_at::date, CURRENT_DATE) AS ticket_date,
    COALESCE(SUM(tx.amount), 0)                                  AS already_recorded
  FROM public.service_tickets st
  LEFT JOIN public.transactions tx
         ON tx.type     = 'Ingreso'
        AND tx.concept  LIKE '%' || st.tracking_number || '%'
  WHERE st.paid_amount > 0
    AND st.tracking_number IS NOT NULL
  GROUP BY
    st.id, st.tracking_number, st.branch_id,
    st.paid_amount, st.received_at, st.created_at
)
INSERT INTO public.transactions (branch_id, transaction_date, type, concept, category, amount)
SELECT
  branch_id,
  ticket_date,
  'Ingreso',
  'Backfill — ' || tracking_number,
  'Servicio',
  paid_amount - already_recorded
FROM ticket_tx_sums
WHERE (paid_amount - already_recorded) > 0;
