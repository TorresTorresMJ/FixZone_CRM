-- Add 'it' frontend role to service_tickets write policies.
-- Employees created via the UI Edge Function can have role = 'it' stored in the DB.
-- Without this fix those employees get an RLS error when trying to create/edit tickets,
-- and the kanban never shows the new ticket (insert silently fails from the user's view
-- because the error alert closes the modal and reloadState falls back to seed data).

drop policy if exists "staff can create tickets" on public.service_tickets;
create policy "staff can create tickets" on public.service_tickets
for insert to authenticated
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));

drop policy if exists "staff can update tickets" on public.service_tickets;
create policy "staff can update tickets" on public.service_tickets
for update to authenticated
using  (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']))
with check (private.has_employee_role(array['owner', 'admin', 'sales', 'technician', 'it']));
