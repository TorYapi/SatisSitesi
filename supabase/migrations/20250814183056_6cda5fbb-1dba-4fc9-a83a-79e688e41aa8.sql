-- Fix critical cart session isolation vulnerability
-- Update cart RLS policies to prevent unauthorized session access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Guest carts by session - secure" ON public.cart;
DROP POLICY IF EXISTS "Guest users can manage session cart items" ON public.cart_items;

-- Create secure cart policy that validates session ownership through application context
CREATE POLICY "Guest carts by session - validated" 
ON public.cart 
FOR ALL 
USING (
  (session_id IS NOT NULL) 
  AND (user_id IS NULL)
  AND (session_id = current_setting('app.session_id', true))
);

-- Create secure cart items policy that validates session ownership
CREATE POLICY "Guest users can manage validated session cart items" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT cart.id 
    FROM cart 
    WHERE (cart.session_id IS NOT NULL) 
      AND (cart.user_id IS NULL)
      AND (cart.session_id = current_setting('app.session_id', true))
  )
);

-- Add missing SET search_path = '' to remaining database functions for security hardening
CREATE OR REPLACE FUNCTION public.check_stock_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Eğer stok 0'dan fazlaya çıktıysa, bekleyen bildirimleri aktif et
  IF OLD.stock_quantity = 0 AND NEW.stock_quantity > 0 THEN
    UPDATE public.stock_notifications 
    SET is_active = true, notified_at = NULL
    WHERE variant_id = NEW.id 
      AND is_active = false
      AND notified_at IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_sale_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Update is_on_sale based on discount dates and value
  NEW.is_on_sale := (
    NEW.discount_value > 0 
    AND NEW.discount_type IS NOT NULL
    AND (NEW.discount_start_date IS NULL OR NEW.discount_start_date <= NOW())
    AND (NEW.discount_end_date IS NULL OR NEW.discount_end_date >= NOW())
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_exchange_rate(currency text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
DECLARE
  current_rate NUMERIC;
BEGIN
  SELECT rate_to_try INTO current_rate
  FROM public.exchange_rates
  WHERE currency_code = currency AND effective_date = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(current_rate, 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.convert_to_try(price numeric, from_currency text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  IF from_currency = 'TRY' THEN
    RETURN price;
  ELSE
    RETURN price * get_current_exchange_rate(from_currency);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_product_variant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;