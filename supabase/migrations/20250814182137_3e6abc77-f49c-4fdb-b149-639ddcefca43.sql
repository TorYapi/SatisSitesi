-- Security Fix Phase 2 (continued): Fix remaining functions

-- Fix handle_admin_signup function  
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  admin_emails_setting JSONB;
  admin_emails TEXT[];
  email_exists BOOLEAN := FALSE;
  email_item TEXT;
BEGIN
  -- Get admin emails from settings
  SELECT value INTO admin_emails_setting
  FROM public.settings
  WHERE key = 'admin_emails'
  LIMIT 1;
  
  -- If no settings found, create default entry and use it
  IF admin_emails_setting IS NULL THEN
    INSERT INTO public.settings (key, value, category, description)
    VALUES (
      'admin_emails',
      '["ugurcan-231@hotmail.com"]'::jsonb,
      'security',
      'List of email addresses that should automatically receive admin privileges'
    );
    admin_emails_setting := '["ugurcan-231@hotmail.com"]'::jsonb;
  END IF;
  
  -- Convert JSONB array to TEXT array and check if email exists
  FOR email_item IN SELECT jsonb_array_elements_text(admin_emails_setting)
  LOOP
    IF email_item = NEW.email THEN
      email_exists := TRUE;
      EXIT;
    END IF;
  END LOOP;
  
  -- Assign role based on email check
  IF email_exists THEN
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

-- Fix update_stock_on_order_confirmation function
CREATE OR REPLACE FUNCTION public.update_stock_on_order_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Sadece status 'pending' veya başka bir durumdan 'confirmed' olduğunda çalış
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Bu siparişin tüm ürünleri için stok düşür
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity - order_items.quantity
    FROM public.order_items
    WHERE order_items.order_id = NEW.id 
      AND order_items.variant_id = product_variants.id
      AND product_variants.stock_quantity >= order_items.quantity;
    
    -- Eğer stok yetersizse error fırlat
    IF EXISTS (
      SELECT 1 
      FROM public.order_items oi
      JOIN public.product_variants pv ON pv.id = oi.variant_id
      WHERE oi.order_id = NEW.id 
        AND pv.stock_quantity < oi.quantity
    ) THEN
      RAISE EXCEPTION 'Yetersiz stok! Sipariş onaylanamaz.';
    END IF;
    
    RAISE NOTICE 'Sipariş % onaylandı ve stoklar güncellendi', NEW.order_number;
  END IF;
  
  -- Sipariş iptal edildiğinde stok geri ekle
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity + order_items.quantity
    FROM public.order_items
    WHERE order_items.order_id = NEW.id 
      AND order_items.variant_id = product_variants.id;
      
    RAISE NOTICE 'Sipariş % iptal edildi ve stoklar geri eklendi', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$function$;