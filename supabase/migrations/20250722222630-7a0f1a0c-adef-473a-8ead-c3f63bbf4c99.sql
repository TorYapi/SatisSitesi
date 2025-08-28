-- Create missing variants for products that don't have any
INSERT INTO public.product_variants (
  product_id, 
  sku, 
  price, 
  stock_quantity, 
  is_active
)
SELECT 
  p.id,
  COALESCE(p.sku, 'VAR-' || p.id::text),
  p.base_price,
  0,
  true
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NULL;