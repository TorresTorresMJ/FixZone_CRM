-- Fix: eliminar service_types duplicados y añadir constraint UNIQUE(name)
-- Corre esto UNA VEZ si ya tienes duplicados de la migración anterior.

-- 1. Quitar duplicados — conserva el registro con el id menor (el primero insertado)
DELETE FROM public.service_types
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid
  FROM public.service_types
  GROUP BY name
);

-- 2. Añadir constraint UNIQUE en name para que nunca vuelva a pasar
ALTER TABLE public.service_types
  ADD CONSTRAINT service_types_name_unique UNIQUE (name);
