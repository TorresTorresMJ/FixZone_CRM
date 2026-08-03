-- =============================================================================
-- FixZone CRM — Reconciliación financiera y de fechas (SOLO LECTURA)
-- =============================================================================
-- Complementa a data_integrity_audit.sql. Ese script confirma que la ESTRUCTURA
-- de la base (esquema, llaves foráneas) está sana. Este script va un nivel más
-- profundo: confirma que los NÚMEROS y las FECHAS que la app muestra realmente
-- cuadran entre sí — que un abono registrado en un ticket tiene su transacción
-- de Ingreso correspondiente, que una venta POS coincide con sus líneas, que
-- nada quedó fechado imposiblemente, etc.
--
-- 100% SELECT — no modifica nada. Mismo formato que el script anterior: una
-- sola tabla, "issues"=0 significa que ese chequeo pasó limpio.
--
-- Secciones:
--   05-DINERO   ¿el dinero registrado en cada ticket/venta/devolución/factura
--                cuadra con sus transacciones vinculadas en Finanzas?
--   06-FECHAS   ¿hay algo fechado en un orden cronológicamente imposible?
-- =============================================================================

select check_group, check_name, issues, sample from (

  -- ================================================================
  -- 05. DINERO — reconciliación ticket ↔ transacciones ↔ POS ↔ facturas
  -- ================================================================

  -- Cada vez que paid_amount de un ticket sube (abono, pago, anticipo), el código
  -- crea una transacción Ingreso con ese mismo delta y ticket_id vinculado
  -- (ver createRemoteTicket/updateRemoteTicket/#abono-form en app.js). Para
  -- tickets NO cancelados, la suma de esos Ingresos vinculados debe ser
  -- exactamente paid_amount. Si no cuadra: un abono se registró sin transacción,
  -- una transacción se borró, o paid_amount se editó manualmente hacia abajo
  -- sin una transacción reversa (esto último no está cubierto por el código).
  select '05-DINERO' as check_group, 'tickets: paid_amount ≠ suma de Ingresos vinculados (no cancelados)' as check_name, count(*) as issues,
    (select string_agg(v,', ') from (
      select t2.tracking_number as v
      from public.service_tickets t2
      where t2.stage <> 'Cancelado'
        and t2.paid_amount <> coalesce((select sum(tr.amount) from public.transactions tr
                                         where tr.ticket_id = t2.id and tr.type = 'Ingreso'), 0)
      limit 5) s) as sample
  from public.service_tickets t
  where t.stage <> 'Cancelado'
    and t.paid_amount <> coalesce((select sum(tr.amount) from public.transactions tr
                                    where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0)

  -- Al cancelar un ticket con saldo pagado, el código reembolsa el 100% de
  -- paid_amount como Egreso/Devolución vinculado por ticket_id (ver
  -- performCancelTicket en app.js). Si el ticket fue cancelado por esa vía, lo
  -- cobrado (Ingreso) y lo reembolsado (Egreso/Devolución) deben coincidir.
  union all
  select '05-DINERO', 'tickets Cancelado: Ingresos cobrados ≠ reembolso (Devolución) vinculado', count(*),
    (select string_agg(v,', ') from (
      select t2.tracking_number as v
      from public.service_tickets t2
      where t2.stage = 'Cancelado'
        and coalesce((select sum(tr.amount) from public.transactions tr
                       where tr.ticket_id = t2.id and tr.type = 'Ingreso'), 0)
          <> coalesce((select sum(tr.amount) from public.transactions tr
                        where tr.ticket_id = t2.id and tr.type = 'Egreso' and tr.category = 'Devolución'), 0)
      limit 5) s)
  from public.service_tickets t
  where t.stage = 'Cancelado'
    and coalesce((select sum(tr.amount) from public.transactions tr
                   where tr.ticket_id = t.id and tr.type = 'Ingreso'), 0)
      <> coalesce((select sum(tr.amount) from public.transactions tr
                    where tr.ticket_id = t.id and tr.type = 'Egreso' and tr.category = 'Devolución'), 0)

  -- pos_sales.total debe coincidir con la suma de sus líneas menos el descuento
  -- aplicado (checkoutPos() construye el total así en el momento de la venta).
  union all
  select '05-DINERO', 'pos_sales: total ≠ (suma de líneas − descuento)', count(*),
    (select string_agg(v,', ') from (
      select ps2.id::text as v
      from public.pos_sales ps2
      where ps2.total <> coalesce((select sum(i.line_total) from public.pos_sale_items i where i.sale_id = ps2.id), 0) - ps2.discount_amount
      limit 5) s)
  from public.pos_sales ps
  where ps.total <> coalesce((select sum(i.line_total) from public.pos_sale_items i where i.sale_id = ps.id), 0) - ps.discount_amount

  -- pos_sales.total debe coincidir con el monto de su transacción de Ingreso vinculada.
  union all
  select '05-DINERO', 'pos_sales: total ≠ monto de la transacción vinculada', count(*),
    (select string_agg(v,', ') from (
      select ps2.id::text as v
      from public.pos_sales ps2
      join public.transactions tr2 on tr2.id = ps2.transaction_id
      where ps2.total <> tr2.amount
      limit 5) s)
  from public.pos_sales ps
  join public.transactions tr on tr.id = ps.transaction_id
  where ps.total <> tr.amount

  -- pos_returns.total_refunded debe coincidir con la suma de sus líneas.
  union all
  select '05-DINERO', 'pos_returns: total_refunded ≠ suma de líneas devueltas', count(*),
    (select string_agg(v,', ') from (
      select pr2.id::text as v
      from public.pos_returns pr2
      where pr2.total_refunded <> coalesce((select sum(i.line_total) from public.pos_return_items i where i.return_id = pr2.id), 0)
      limit 5) s)
  from public.pos_returns pr
  where pr.total_refunded <> coalesce((select sum(i.line_total) from public.pos_return_items i where i.return_id = pr.id), 0)

  -- pos_returns.total_refunded debe coincidir con su transacción de Egreso vinculada.
  union all
  select '05-DINERO', 'pos_returns: total_refunded ≠ monto de la transacción vinculada', count(*),
    (select string_agg(v,', ') from (
      select pr2.id::text as v
      from public.pos_returns pr2
      join public.transactions tr2 on tr2.id = pr2.transaction_id
      where pr2.total_refunded <> tr2.amount
      limit 5) s)
  from public.pos_returns pr
  join public.transactions tr on tr.id = pr.transaction_id
  where pr.total_refunded <> tr.amount

  -- invoices.amount debe coincidir con su transacción vinculada (cuando aplica).
  union all
  select '05-DINERO', 'invoices: amount ≠ monto de la transacción vinculada', count(*),
    (select string_agg(v,', ') from (
      select i2.id::text as v
      from public.invoices i2
      join public.transactions tr2 on tr2.id = i2.transaction_id
      where i2.amount <> tr2.amount
      limit 5) s)
  from public.invoices i
  join public.transactions tr on tr.id = i.transaction_id
  where i.amount <> tr.amount

  -- ================================================================
  -- 06. FECHAS — cronología imposible
  -- ================================================================

  union all
  select '06-FECHAS', 'tickets: delivered_at antes de received_at', count(*),
    (select string_agg(v,', ') from (
      select t2.tracking_number as v from public.service_tickets t2
      where t2.delivered_at is not null and t2.delivered_at::date < t2.received_at::date
      limit 5) s)
  from public.service_tickets t
  where t.delivered_at is not null and t.delivered_at::date < t.received_at::date

  union all
  select '06-FECHAS', 'tickets: updated_at antes de created_at (no debería ser posible — confirmación)', count(*),
    (select string_agg(v,', ') from (
      select t2.tracking_number as v from public.service_tickets t2
      where t2.updated_at < t2.created_at limit 5) s)
  from public.service_tickets t
  where t.updated_at < t.created_at

  union all
  select '06-FECHAS', 'transactions: transaction_date en el futuro', count(*),
    (select string_agg(v,', ') from (
      select tr2.id::text as v from public.transactions tr2
      where tr2.transaction_date > current_date limit 5) s)
  from public.transactions tr
  where tr.transaction_date > current_date

  union all
  select '06-FECHAS', 'supply_purchases: purchase_date en el futuro', count(*),
    (select string_agg(v,', ') from (
      select sp2.id::text as v from public.supply_purchases sp2
      where sp2.purchase_date > current_date limit 5) s)
  from public.supply_purchases sp
  where sp.purchase_date > current_date

  union all
  select '06-FECHAS', 'invoices: invoice_date en el futuro', count(*),
    (select string_agg(v,', ') from (
      select i2.id::text as v from public.invoices i2
      where i2.invoice_date > current_date limit 5) s)
  from public.invoices i
  where i.invoice_date > current_date

  union all
  select '06-FECHAS', 'customer_devices creado > 1 min después del ticket que lo referencia', count(*),
    (select string_agg(v,', ') from (
      select t2.tracking_number as v
      from public.service_tickets t2
      join public.customer_devices d2 on d2.id = t2.device_id
      where d2.created_at > t2.created_at + interval '1 minute'
      limit 5) s)
  from public.service_tickets t
  join public.customer_devices d on d.id = t.device_id
  where d.created_at > t.created_at + interval '1 minute'

  union all
  select '06-FECHAS', 'ticket_events fechado > 1 min antes de la creación del ticket', count(*),
    (select string_agg(v,', ') from (
      select te2.id::text as v
      from public.ticket_events te2
      join public.service_tickets t2 on t2.id = te2.ticket_id
      where te2.created_at < t2.created_at - interval '1 minute'
      limit 5) s)
  from public.ticket_events te
  join public.service_tickets t on t.id = te.ticket_id
  where te.created_at < t.created_at - interval '1 minute'

) x
order by check_group, issues desc, check_name;
