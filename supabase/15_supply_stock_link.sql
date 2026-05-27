-- Migration 15: Link supply_purchases → products with auto stock increment
-- Ejecutar DESPUÉS de migration 14 (14_inventory_vallarta.sql)

-- 1. Agregar FK product_id a supply_purchases (nullable — compras sin producto en catálogo siguen funcionando)
ALTER TABLE public.supply_purchases
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- 2. Función trigger: incrementa stock en products cuando se inserta una compra vinculada
CREATE OR REPLACE FUNCTION public.increment_product_stock_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock      = stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger AFTER INSERT en supply_purchases
DROP TRIGGER IF EXISTS supply_purchase_increment_stock ON public.supply_purchases;
CREATE TRIGGER supply_purchase_increment_stock
  AFTER INSERT ON public.supply_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_product_stock_on_purchase();

-- Nota: el trigger solo aplica en INSERT (compras nuevas).
-- Editar o eliminar una compra NO ajusta el stock automáticamente — hacerlo manualmente si es necesario.

-- Verificación
SELECT
  column_name, data_type
FROM information_schema.columns
WHERE table_name = 'supply_purchases' AND column_name IN ('product_id', 'receipt_url')
ORDER BY column_name;
