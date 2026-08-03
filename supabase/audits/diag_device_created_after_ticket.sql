-- Diagnóstico del hallazgo "customer_devices creado > 1 min después del ticket"
-- Solo lectura. Muestra el detalle crudo para inspección manual: cuánto tiempo
-- pasó entre la creación del ticket y la del dispositivo que terminó vinculado.

select
  t.tracking_number,
  t.created_at        as ticket_created_at,
  d.created_at         as device_created_at,
  (d.created_at - t.created_at) as gap,
  d.id                 as device_id,
  d.product_name,
  d.imei,
  d.serial_number
from public.service_tickets t
join public.customer_devices d on d.id = t.device_id
where d.created_at > t.created_at + interval '1 minute'
order by gap desc;
