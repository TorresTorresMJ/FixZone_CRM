-- =============================================================================
-- FixZone CRM — Auditoría de integridad de datos (SOLO LECTURA)
-- =============================================================================
-- Correr completo en el SQL Editor de Supabase (proyecto zwmffnrkrrowmchluyyy).
-- No modifica NINGÚN dato — son puros SELECT. Seguro de correr en producción
-- las veces que haga falta.
--
-- Cómo leerlo: una sola tabla de resultado, una fila por chequeo.
--   - "issues" = 0   -> todo bien, no se requiere acción.
--   - "issues" > 0   -> hay registros que no cumplen el invariante esperado;
--                       "sample" trae hasta 5 folios/ids/valores de ejemplo
--                       para poder abrirlos en el CRM y revisarlos.
-- Secciones (check_group):
--   00-RESUMEN      conteos generales, informativo — nunca son "issues" reales
--   01-ESQUEMA      confirma que las migraciones numeradas (supabase/*.sql)
--                    ya se aplicaron — columnas/tablas/constraints esperadas
--   02-INTEGRIDAD   llaves foráneas huérfanas (la mayoría ya las bloquea
--                    Postgres a nivel de columna; sirven como confirmación)
--   03-LOGICA       invariantes de negocio que SOLO enforcea el código JS,
--                    no la base de datos — aquí es donde un bug reciente
--                    dejaría rastro
--   04-VOCABULARIO  valores de texto libre que deberían venir de un picklist
--                    fijo pero no tienen CHECK constraint en la DB
--
-- Generado 2026-08-03 tras la sesión de cambios en: orden del kanban por
-- última modificación, vínculo Insumos↔Egresos desde Finanzas, y como
-- chequeo general de que ninguna migración quedó sin aplicar en producción.
-- =============================================================================

select check_group, check_name, issues, sample from (

  -- ================================================================
  -- 00. RESUMEN GENERAL (informativo)
  -- ================================================================
  select '00-RESUMEN' as check_group, 'total service_tickets' as check_name, count(*) as issues, null::text as sample from public.service_tickets
  union all select '00-RESUMEN', 'tickets: stage=Cotizacion',    count(*), null from public.service_tickets where stage='Cotizacion'
  union all select '00-RESUMEN', 'tickets: stage=Recibido',      count(*), null from public.service_tickets where stage='Recibido'
  union all select '00-RESUMEN', 'tickets: stage=En reparacion', count(*), null from public.service_tickets where stage='En reparacion'
  union all select '00-RESUMEN', 'tickets: stage=Listo',         count(*), null from public.service_tickets where stage='Listo'
  union all select '00-RESUMEN', 'tickets: stage=Entregado',     count(*), null from public.service_tickets where stage='Entregado'
  union all select '00-RESUMEN', 'tickets: stage=Garantia',      count(*), null from public.service_tickets where stage='Garantia'
  union all select '00-RESUMEN', 'tickets: stage=Cancelado',     count(*), null from public.service_tickets where stage='Cancelado'
  union all select '00-RESUMEN', 'total customers',              count(*), null from public.customers
  union all select '00-RESUMEN', 'total customer_devices',       count(*), null from public.customer_devices
  union all select '00-RESUMEN', 'total products',                count(*), null from public.products
  union all select '00-RESUMEN', 'total transactions',            count(*), null from public.transactions
  union all select '00-RESUMEN', 'total supply_purchases',        count(*), null from public.supply_purchases
  union all select '00-RESUMEN', 'total pos_sales',                count(*), null from public.pos_sales
  union all select '00-RESUMEN', 'total pos_sale_items',           count(*), null from public.pos_sale_items
  union all select '00-RESUMEN', 'total discount_codes',           count(*), null from public.discount_codes
  union all select '00-RESUMEN', 'total invoices',                 count(*), null from public.invoices
  union all select '00-RESUMEN', 'empleados activos',              count(*), null from public.employees where status='active'
  union all select '00-RESUMEN', 'total branches',                 count(*), null from public.branches

  -- ================================================================
  -- 01. ESQUEMA — ¿ya se aplicaron todas las migraciones numeradas?
  -- ================================================================
  union all
  select '01-ESQUEMA', 'tablas nuevas faltantes', count(*), nullif(string_agg(t, ', '), '')
  from unnest(array['discount_codes','service_types','service_prices','invoices','brand_assets',
                     'notifications','support_task_comments','app_settings','team_tasks',
                     'pos_returns','pos_return_items','support_tasks']) as t
  where t not in (select table_name from information_schema.tables where table_schema='public')

  union all
  select '01-ESQUEMA', 'service_tickets: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['cancel_reason','waiting_part','waiting_part_note','due_date','cotizacion_ref',
                     'converted_to_ticket','payment_method','discount_code','discount_amount',
                     'discount_pct','quote_items','quoted_at','recibido_sealed_at','timer_target_at',
                     'service_type']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='service_tickets')

  union all
  select '01-ESQUEMA', 'customer_devices: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['unlock_type','unlock_pin','unlock_pattern']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='customer_devices')

  union all
  select '01-ESQUEMA', 'customers: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['how_found','how_found_other']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='customers')

  union all
  select '01-ESQUEMA', 'supply_purchases: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['product_id','transaction_id','ticket_id']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='supply_purchases')

  union all
  select '01-ESQUEMA', 'transactions: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['receipt_url']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='transactions')

  union all
  select '01-ESQUEMA', 'team_tasks: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['due_date']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='team_tasks')

  union all
  select '01-ESQUEMA', 'employees: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['can_access_contaduria']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='employees')

  union all
  select '01-ESQUEMA', 'service_prices: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['variant']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='service_prices')

  union all
  select '01-ESQUEMA', 'service_types: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['default_price']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='service_types')

  union all
  select '01-ESQUEMA', 'attachments: columnas faltantes', count(*), nullif(string_agg(c, ', '), '')
  from unnest(array['task_id']) as c
  where c not in (select column_name from information_schema.columns where table_schema='public' and table_name='attachments')

  union all
  select '01-ESQUEMA', 'constraint: service_tickets.stage permite Cancelado (migración 46)',
    (case when exists (
      select 1 from pg_constraint
      where conname = 'service_tickets_stage_check'
        and pg_get_constraintdef(oid) like '%Cancelado%'
    ) then 0 else 1 end)::bigint, null::text

  union all
  select '01-ESQUEMA', 'constraint: products.stock_non_negative existe (migración 17)',
    (case when exists (select 1 from pg_constraint where conname='stock_non_negative') then 0 else 1 end)::bigint, null::text

  union all
  select '01-ESQUEMA', 'constraint: service_types UNIQUE(name) existe (migración 21b)',
    (case when exists (select 1 from pg_constraint where conname='service_types_name_unique') then 0 else 1 end)::bigint, null::text

  union all
  select '01-ESQUEMA', 'constraint: service_prices UNIQUE(...,variant) existe (migración 22)',
    (case when exists (select 1 from pg_constraint where conname='service_prices_unique_with_variant') then 0 else 1 end)::bigint, null::text

  -- ================================================================
  -- 02. INTEGRIDAD REFERENCIAL (la mayoría ya bloqueada por FK — confirmación)
  -- ================================================================
  union all
  select '02-INTEGRIDAD', 'tickets con customer_id huérfano', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.customer_id is not null and not exists (select 1 from public.customers c where c.id=t2.customer_id)
      order by v limit 5) s)
  from public.service_tickets t
  where t.customer_id is not null and not exists (select 1 from public.customers c where c.id=t.customer_id)

  union all
  select '02-INTEGRIDAD', 'tickets con device_id huérfano', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.device_id is not null and not exists (select 1 from public.customer_devices d where d.id=t2.device_id)
      order by v limit 5) s)
  from public.service_tickets t
  where t.device_id is not null and not exists (select 1 from public.customer_devices d where d.id=t.device_id)

  union all
  select '02-INTEGRIDAD', 'tickets con branch_id huérfano', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.branch_id is not null and not exists (select 1 from public.branches b where b.id=t2.branch_id)
      order by v limit 5) s)
  from public.service_tickets t
  where t.branch_id is not null and not exists (select 1 from public.branches b where b.id=t.branch_id)

  union all
  select '02-INTEGRIDAD', 'tickets con assigned_employee_id huérfano', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.assigned_employee_id is not null and not exists (select 1 from public.employees e where e.id=t2.assigned_employee_id)
      order by v limit 5) s)
  from public.service_tickets t
  where t.assigned_employee_id is not null and not exists (select 1 from public.employees e where e.id=t.assigned_employee_id)

  union all
  select '02-INTEGRIDAD', 'supply_purchases con transaction_id huérfano', count(*),
    (select string_agg(v,', ') from (select sp2.id::text as v from public.supply_purchases sp2
      where sp2.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=sp2.transaction_id)
      limit 5) s)
  from public.supply_purchases sp
  where sp.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=sp.transaction_id)

  union all
  select '02-INTEGRIDAD', 'supply_purchases con ticket_id huérfano', count(*),
    (select string_agg(v,', ') from (select sp2.id::text as v from public.supply_purchases sp2
      where sp2.ticket_id is not null and not exists (select 1 from public.service_tickets t where t.id=sp2.ticket_id)
      limit 5) s)
  from public.supply_purchases sp
  where sp.ticket_id is not null and not exists (select 1 from public.service_tickets t where t.id=sp.ticket_id)

  union all
  select '02-INTEGRIDAD', 'supply_purchases con product_id huérfano', count(*),
    (select string_agg(v,', ') from (select sp2.id::text as v from public.supply_purchases sp2
      where sp2.product_id is not null and not exists (select 1 from public.products p where p.id=sp2.product_id)
      limit 5) s)
  from public.supply_purchases sp
  where sp.product_id is not null and not exists (select 1 from public.products p where p.id=sp.product_id)

  union all
  select '02-INTEGRIDAD', 'transactions con ticket_id huérfano', count(*),
    (select string_agg(v,', ') from (select tr2.id::text as v from public.transactions tr2
      where tr2.ticket_id is not null and not exists (select 1 from public.service_tickets t where t.id=tr2.ticket_id)
      limit 5) s)
  from public.transactions tr
  where tr.ticket_id is not null and not exists (select 1 from public.service_tickets t where t.id=tr.ticket_id)

  union all
  select '02-INTEGRIDAD', 'pos_sales con transaction_id huérfano', count(*),
    (select string_agg(v,', ') from (select ps2.id::text as v from public.pos_sales ps2
      where ps2.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=ps2.transaction_id)
      limit 5) s)
  from public.pos_sales ps
  where ps.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=ps.transaction_id)

  union all
  select '02-INTEGRIDAD', 'invoices con transaction_id huérfano', count(*),
    (select string_agg(v,', ') from (select i2.id::text as v from public.invoices i2
      where i2.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=i2.transaction_id)
      limit 5) s)
  from public.invoices i
  where i.transaction_id is not null and not exists (select 1 from public.transactions tr where tr.id=i.transaction_id)

  union all
  select '02-INTEGRIDAD', 'service_prices con service_type_id huérfano', count(*),
    (select string_agg(v,', ') from (select sp2.id::text as v from public.service_prices sp2
      where not exists (select 1 from public.service_types st where st.id=sp2.service_type_id)
      limit 5) s)
  from public.service_prices sp
  where not exists (select 1 from public.service_types st where st.id=sp.service_type_id)

  union all
  select '02-INTEGRIDAD', 'employees con branch_id huérfano', count(*),
    (select string_agg(v,', ') from (select e2.full_name as v from public.employees e2
      where e2.branch_id is not null and not exists (select 1 from public.branches b where b.id=e2.branch_id)
      limit 5) s)
  from public.employees e
  where e.branch_id is not null and not exists (select 1 from public.branches b where b.id=e.branch_id)

  -- ================================================================
  -- 03. LÓGICA DE NEGOCIO — invariantes que solo enforcea el código JS
  -- ================================================================
  union all
  select '03-LOGICA', 'products con stock negativo', count(*),
    (select string_agg(v,', ') from (select p2.name as v from public.products p2 where p2.stock < 0 limit 5) s)
  from public.products p where p.stock < 0

  union all
  select '03-LOGICA', 'pos_sales sin ninguna línea (pos_sale_items) — mismo bug que migración 44', count(*),
    (select string_agg(v,', ') from (select ps2.id::text as v from public.pos_sales ps2
      where ps2.created_at < now() - interval '10 minutes'
        and not exists (select 1 from public.pos_sale_items i where i.sale_id = ps2.id)
      limit 5) s)
  from public.pos_sales ps
  where ps.created_at < now() - interval '10 minutes'
    and not exists (select 1 from public.pos_sale_items i where i.sale_id = ps.id)

  union all
  select '03-LOGICA', 'tickets Cancelado con paid_amount/payment_status sin resetear', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.stage='Cancelado' and (t2.paid_amount <> 0 or t2.payment_status <> 'Pendiente')
      limit 5) s)
  from public.service_tickets t
  where t.stage='Cancelado' and (t.paid_amount <> 0 or t.payment_status <> 'Pendiente')

  union all
  select '03-LOGICA', 'tickets Entregado/Garantia sin delivered_at sellado', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.stage in ('Entregado','Garantia') and t2.delivered_at is null limit 5) s)
  from public.service_tickets t
  where t.stage in ('Entregado','Garantia') and t.delivered_at is null

  union all
  select '03-LOGICA', 'tickets (stage<>Cotizacion) sin recibido_sealed_at (backfill 37/49 incompleto)', count(*),
    (select string_agg(v,', ') from (select t2.tracking_number as v from public.service_tickets t2
      where t2.stage <> 'Cotizacion' and t2.recibido_sealed_at is null limit 5) s)
  from public.service_tickets t
  where t.stage <> 'Cotizacion' and t.recibido_sealed_at is null

  union all
  select '03-LOGICA', 'ticket_events event_type=created con to_stage null (bug migración 49)', count(*),
    (select string_agg(v,', ') from (select te2.id::text as v from public.ticket_events te2
      where te2.event_type='created' and te2.to_stage is null limit 5) s)
  from public.ticket_events te
  where te.event_type='created' and te.to_stage is null

  union all
  select '03-LOGICA', 'discount_codes con used_count > max_uses', count(*),
    (select string_agg(v,', ') from (select dc2.code as v from public.discount_codes dc2
      where dc2.max_uses is not null and dc2.used_count > dc2.max_uses limit 5) s)
  from public.discount_codes dc
  where dc.max_uses is not null and dc.used_count > dc.max_uses

  union all
  select '03-LOGICA', 'discount_codes con valid_until < valid_from', count(*),
    (select string_agg(v,', ') from (select dc2.code as v from public.discount_codes dc2
      where dc2.valid_from is not null and dc2.valid_until is not null and dc2.valid_until < dc2.valid_from limit 5) s)
  from public.discount_codes dc
  where dc.valid_from is not null and dc.valid_until is not null and dc.valid_until < dc.valid_from

  union all
  select '03-LOGICA', 'discount_codes.scope con valores fuera de pos/cotizacion/ticket', count(*),
    (select string_agg(v,', ') from (select dc2.code as v from public.discount_codes dc2
      where exists (select 1 from unnest(dc2.scope) s2 where s2 not in ('pos','cotizacion','ticket')) limit 5) s)
  from public.discount_codes dc
  where exists (select 1 from unnest(dc.scope) s2 where s2 not in ('pos','cotizacion','ticket'))

  union all
  select '03-LOGICA', 'supply_purchases con total_amount ≠ transacción vinculada (desync)', count(*),
    (select string_agg(v,', ') from (select sp2.id::text as v from public.supply_purchases sp2
      join public.transactions tr2 on tr2.id = sp2.transaction_id
      where round(sp2.total_amount,2) <> round(tr2.amount,2) limit 5) s)
  from public.supply_purchases sp
  join public.transactions tr on tr.id = sp.transaction_id
  where round(sp.total_amount,2) <> round(tr.amount,2)

  union all
  select '03-LOGICA', 'Egresos/Insumos sin supply_purchases vinculada (sin trazabilidad a inventario)', count(*),
    (select string_agg(v,', ') from (select tr2.id::text as v from public.transactions tr2
      where tr2.type='Egreso' and tr2.category='Insumos'
        and not exists (select 1 from public.supply_purchases sp where sp.transaction_id = tr2.id)
      limit 5) s)
  from public.transactions tr
  where tr.type='Egreso' and tr.category='Insumos'
    and not exists (select 1 from public.supply_purchases sp where sp.transaction_id = tr.id)

  union all
  select '03-LOGICA', 'supply_purchases duplicadas apuntando a la misma transacción', count(*),
    (select string_agg(v,', ') from (
      select transaction_id::text as v from public.supply_purchases where transaction_id is not null
      group by transaction_id having count(*) > 1 limit 5) s)
  from (select transaction_id from public.supply_purchases where transaction_id is not null group by transaction_id having count(*) > 1) dup

  union all
  select '03-LOGICA', 'service_types duplicados por nombre', count(*),
    (select string_agg(v,', ') from (select name as v from public.service_types group by name having count(*)>1 limit 5) s)
  from (select name from public.service_types group by name having count(*)>1) dup

  union all
  select '03-LOGICA', 'service_prices duplicados (device+servicio+sucursal+variante)', count(*),
    (select string_agg(v,', ') from (
      select device_model||' / '||coalesce(variant,'') as v from public.service_prices
      group by device_model, service_type_id, branch_id, variant having count(*)>1 limit 5) s)
  from (select 1 from public.service_prices group by device_model, service_type_id, branch_id, variant having count(*)>1) dup

  union all
  select '03-LOGICA', 'service_prices con variant NULL (debería ser cadena vacía)', count(*),
    (select string_agg(v,', ') from (select id::text as v from public.service_prices where variant is null limit 5) s)
  from public.service_prices sp where sp.variant is null

  union all
  select '03-LOGICA', 'empleados activos sin auth_user_id (no pueden iniciar sesión)', count(*),
    (select string_agg(v,', ') from (select full_name as v from public.employees where status='active' and auth_user_id is null limit 5) s)
  from public.employees e
  where e.status='active' and e.auth_user_id is null

  union all
  select '03-LOGICA', 'empleados con role=owner (debería estar unificado a admin, migración 11)', count(*),
    (select string_agg(v,', ') from (select full_name as v from public.employees where role='owner' limit 5) s)
  from public.employees e where e.role='owner'

  union all
  select '03-LOGICA', 'clientes con how_found=Otro sin especificar', count(*),
    (select string_agg(v,', ') from (select full_name as v from public.customers where how_found='Otro' and coalesce(trim(how_found_other),'')='' limit 5) s)
  from public.customers c
  where c.how_found='Otro' and coalesce(trim(c.how_found_other),'')=''

  union all
  select '03-LOGICA', 'quote_items con forma inválida (no es array JSON)', count(*),
    (select string_agg(v,', ') from (select tracking_number as v from public.service_tickets where quote_items is not null and jsonb_typeof(quote_items) <> 'array' limit 5) s)
  from public.service_tickets t
  where t.quote_items is not null and jsonb_typeof(t.quote_items) <> 'array'

  union all
  select '03-LOGICA', 'unlock_pattern con forma inválida (no es array JSON)', count(*),
    (select string_agg(v,', ') from (select id::text as v from public.customer_devices where unlock_pattern is not null and jsonb_typeof(unlock_pattern) <> 'array' limit 5) s)
  from public.customer_devices d
  where d.unlock_pattern is not null and jsonb_typeof(d.unlock_pattern) <> 'array'

  -- ================================================================
  -- 04. VOCABULARIO — texto libre que debería salir de un picklist fijo
  -- ================================================================
  union all
  select '04-VOCABULARIO', 'transactions.payment_method fuera del picklist estándar', count(*),
    (select string_agg(distinct v,', ') from (select payment_method as v from public.transactions
      where payment_method is not null and payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro')) s)
  from public.transactions tr
  where tr.payment_method is not null
    and tr.payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro')

  -- 'Múltiple' es un valor INTENCIONAL solo a nivel ticket (no a nivel transacción/pos_sale)
  -- que el código usa cuando un ticket se pagó con más de un método distinto entre sus
  -- abonos — ver syncTicketPaymentMethodToTransactions() y el submit de #abono-form en
  -- app.js. Por eso se excluye aquí y NO en los mismos chequeos de transactions/pos_sales.
  union all
  select '04-VOCABULARIO', 'service_tickets.payment_method fuera del picklist estándar (+Múltiple)', count(*),
    (select string_agg(distinct v,', ') from (select payment_method as v from public.service_tickets
      where payment_method is not null and payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro','Múltiple')) s)
  from public.service_tickets t
  where t.payment_method is not null
    and t.payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro','Múltiple')

  union all
  select '04-VOCABULARIO', 'pos_sales.payment_method fuera del picklist estándar', count(*),
    (select string_agg(distinct v,', ') from (select payment_method as v from public.pos_sales
      where payment_method is not null and payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro')) s)
  from public.pos_sales ps
  where ps.payment_method is not null
    and ps.payment_method not in ('Efectivo','Transferencia','Link de pago','Terminal TC','Terminal TD','Otro')

) x
order by check_group, issues desc, check_name;
