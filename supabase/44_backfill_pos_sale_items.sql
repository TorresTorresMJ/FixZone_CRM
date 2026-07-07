-- 44_backfill_pos_sale_items.sql
-- Reconstruye pos_sale_items para ventas POS antiguas que quedaron sin líneas de producto
-- (ej. si el INSERT de pos_sale_items falló justo después de crear el pos_sales, dejando
-- una venta "huérfana" — total y método guardados, pero ningún producto). Esto es lo que
-- causaba recibos sin productos al reimprimir ventas viejas.
--
-- Se reconstruye a partir de transactions.concept, que desde el principio guarda el texto
-- "POS: {cantidad}× {producto}, ... — {cliente}" (ver checkoutPos() en app.js). Se intenta
-- casar cada producto por nombre contra la tabla products para recuperar su product_id y un
-- precio unitario de referencia; luego se escala ese precio para que la suma de las líneas
-- coincida exactamente con pos_sales.total (el total real ya registrado no cambia).
--
-- ⚠️ Efecto colateral esperado (y deseado): al insertar estas líneas, el trigger existente
-- `pos_sale_items_decrement_stock` (migración 13) se dispara y descuenta el stock de cada
-- producto — stock que NUNCA se descontó en su momento porque el INSERT original falló. Si
-- el stock de esos productos ya fue corregido manualmente por otra vía, revisar antes de
-- aplicar esta migración para no descontarlo dos veces.

do $$
declare
  sale         record;
  concept_body text;
  items_part   text;
  item_str     text;
  m            text[];
  qty          numeric;
  desc_name    text;
  prod         record;
  computed_total numeric;
  scale        numeric;
  descs        text[];
  qtys         numeric[];
  prices       numeric[];
  prod_ids     uuid[];
  i            int;
begin
  for sale in
    select ps.id, ps.total, ps.transaction_id
    from public.pos_sales ps
    where ps.transaction_id is not null
      and not exists (select 1 from public.pos_sale_items psi where psi.sale_id = ps.id)
  loop
    select t.concept into concept_body from public.transactions t where t.id = sale.transaction_id;
    if concept_body is null or concept_body !~ '^POS: ' then
      continue;
    end if;

    items_part := regexp_replace(concept_body, '^POS: ', '');
    items_part := regexp_replace(items_part, ' — .*$', '');

    descs           := array[]::text[];
    qtys            := array[]::numeric[];
    prices          := array[]::numeric[];
    prod_ids        := array[]::uuid[];
    computed_total  := 0;

    foreach item_str in array string_to_array(items_part, ', ')
    loop
      m := regexp_match(item_str, '^([0-9]+(?:\.[0-9]+)?)× (.+)$');
      if m is null then continue; end if;
      qty       := m[1]::numeric;
      desc_name := trim(m[2]);

      select p.id, p.sale_price into prod from public.products p
        where lower(p.name) = lower(desc_name) limit 1;

      descs    := descs    || desc_name;
      qtys     := qtys     || qty;
      prices   := prices   || coalesce(prod.sale_price, 0);
      prod_ids := prod_ids || prod.id;

      computed_total := computed_total + (qty * coalesce(prod.sale_price, 0));
    end loop;

    if array_length(descs, 1) is null then
      continue;
    end if;

    scale := case when computed_total > 0 then sale.total / computed_total else 0 end;

    for i in 1..array_length(descs, 1) loop
      insert into public.pos_sale_items (sale_id, product_id, description, quantity, unit_price)
      values (sale.id, prod_ids[i], descs[i], qtys[i], round(prices[i] * scale, 2));
    end loop;
  end loop;
end $$;
