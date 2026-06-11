-- 28_it_role_pos_tables.sql
-- pos_sales / pos_sale_items (migration 13) were created after 08_fix_attachments_and_remaining.sql
-- and never got the additive "it can manage *" policy, so employees with role = 'it'
-- (never normalized to 'admin') get "violates row-level security policy" on POS checkout.

drop policy if exists "it can manage pos sales" on public.pos_sales;
create policy "it can manage pos sales" on public.pos_sales
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));

drop policy if exists "it can manage pos sale items" on public.pos_sale_items;
create policy "it can manage pos sale items" on public.pos_sale_items
for all to authenticated
using  (private.has_employee_role(array['it']))
with check (private.has_employee_role(array['it']));
