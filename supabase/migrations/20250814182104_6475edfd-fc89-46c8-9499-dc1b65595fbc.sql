-- Security Fix Phase 2: Database Security Hardening
-- Add missing SET search_path = '' to database functions

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.customers (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$function$;

-- Fix check_stock_and_notify function
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

-- Fix log_customer_access function
CREATE OR REPLACE FUNCTION public.log_customer_access(p_action_type text, p_table_name text, p_record_id uuid DEFAULT NULL::uuid, p_customer_data jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    table_name,
    record_id,
    customer_data,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_table_name,
    p_record_id,
    p_customer_data,
    inet_client_addr(),
    now()
  );
END;
$function$;