-- Ensure brands table structure is correct and create a brand if none exists
INSERT INTO public.brands (name, slug, is_active, description)
SELECT 'Markasız', 'markasiz', true, 'Varsayılan marka'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'markasiz');

-- Create a function to automatically create a default product variant when a product is created
CREATE OR REPLACE FUNCTION public.create_default_product_variant()
RETURNS trigger AS $$
BEGIN
  -- Create a default variant for the new product if no variants exist
  INSERT INTO public.product_variants (
    product_id, 
    sku, 
    price, 
    stock_quantity, 
    is_active
  ) VALUES (
    NEW.id,
    COALESCE(NEW.sku, 'VAR-' || NEW.id::text),
    NEW.base_price,
    0, -- Default stock is 0
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create default variant
DROP TRIGGER IF EXISTS trigger_create_default_variant ON public.products;
CREATE TRIGGER trigger_create_default_variant
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_product_variant();