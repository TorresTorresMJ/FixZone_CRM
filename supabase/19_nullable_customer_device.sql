-- Allow device records to exist without a registered customer.
-- Needed for walk-in / quick tickets where the client is not registered.
ALTER TABLE public.customer_devices
  ALTER COLUMN customer_id DROP NOT NULL;
