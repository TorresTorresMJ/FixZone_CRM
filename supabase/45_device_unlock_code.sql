-- Adds NIP / patrón de desbloqueo fields to customer_devices, so the technician can
-- record how to unlock the device at intake (walk-in ticket / cotización) without
-- depending on the customer being reachable later. unlock_pattern stores the ordered
-- sequence of dot indices (0-8, left-to-right/top-to-bottom on a 3x3 grid) as jsonb,
-- e.g. [0,3,6,7,8] — used by the frontend to render/replay the pattern visually.
alter table public.customer_devices
  add column if not exists unlock_type text check (unlock_type in ('pin','patron')),
  add column if not exists unlock_pin text,
  add column if not exists unlock_pattern jsonb;
