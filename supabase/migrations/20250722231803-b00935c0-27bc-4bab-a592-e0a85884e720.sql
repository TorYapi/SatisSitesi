-- Fix RLS policies for order_items table to allow users to create their own order items
CREATE POLICY "Users can create order items for their own orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  order_id IN (
    SELECT o.id 
    FROM orders o 
    JOIN customers c ON o.customer_id = c.id 
    WHERE c.user_id = auth.uid()
  )
);

-- Allow users to view their own order items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (
  order_id IN (
    SELECT o.id 
    FROM orders o 
    JOIN customers c ON o.customer_id = c.id 
    WHERE c.user_id = auth.uid()
  )
);

-- Fix RLS policies for orders table to allow users to create and view their own orders
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (
  customer_id IN (
    SELECT id FROM customers WHERE user_id = auth.uid()
  )
);

-- Fix function search_path security issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
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

CREATE OR REPLACE FUNCTION public.handle_admin_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'ugurcan-231@hotmail.com'
  ];
BEGIN
  -- Check if the user's email is in the admin list
  IF NEW.email = ANY(admin_emails) THEN
    -- Insert admin role for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Insert regular user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
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

-- Drop the problematic duplicate has_role function
DROP FUNCTION IF EXISTS public.has_role(text);