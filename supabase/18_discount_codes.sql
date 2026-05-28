-- Migration 18: discount_codes table
-- Stores reusable discount codes with optional date range, usage limit,
-- scope, and value (fixed MXN or percentage).
-- Apply in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  description   text,
  type          text NOT NULL CHECK (type IN ('fixed','percent')),  -- 'fixed'=MXN, 'percent'=%
  value         numeric(10,2) NOT NULL CHECK (value > 0),
  max_uses      int,                     -- NULL = unlimited
  used_count    int NOT NULL DEFAULT 0,
  valid_from    date,
  valid_until   date,
  scope         text[] DEFAULT ARRAY['pos','cotizacion','ticket'],  -- where the code is valid
  active        boolean NOT NULL DEFAULT true,
  branch_id     uuid REFERENCES public.branches(id),               -- NULL = all branches
  created_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active employees can read discount_codes"
  ON public.discount_codes FOR SELECT
  USING (private.is_active_employee());

CREATE POLICY "admin can manage discount_codes"
  ON public.discount_codes FOR ALL
  USING (private.has_employee_role(ARRAY['owner','admin','it']))
  WITH CHECK (private.has_employee_role(ARRAY['owner','admin','it']));
