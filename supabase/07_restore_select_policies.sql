-- The SELECT policy on service_tickets was dropped (likely during debugging).
-- Restore it so that authenticated employees can read tickets after inserting.
-- Also restores SELECT for other tables that may have been affected.

drop policy if exists "active employees can read tickets" on public.service_tickets;
create policy "active employees can read tickets" on public.service_tickets
for select to authenticated
using (private.is_active_employee());

-- Clean up the debug policy that allows unrestricted inserts (no longer needed)
drop policy if exists "debug insert tickets" on public.service_tickets;
