-- Fix security definer functions to prevent search path attacks
CREATE OR REPLACE FUNCTION public.check_stock_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
SECURITY DEFINER
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

-- Add enhanced audit logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
  p_operation_type text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_sensitive_data jsonb DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS void
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
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    p_operation_type,
    p_table_name,
    p_record_id,
    p_sensitive_data,
    inet_client_addr(),
    p_user_agent,
    now()
  );
END;
$function$;

-- Add function to securely mask sensitive data
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(
  p_data_type text,
  p_value text,
  p_user_role app_role
) RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only admins see full data, managers see masked data
  IF p_user_role = 'admin' THEN
    RETURN p_value;
  END IF;
  
  CASE p_data_type
    WHEN 'email' THEN
      IF p_value IS NULL THEN
        RETURN NULL;
      END IF;
      RETURN SUBSTRING(p_value FROM 1 FOR 3) || '***@' || SPLIT_PART(p_value, '@', 2);
    WHEN 'phone' THEN
      IF p_value IS NULL THEN
        RETURN NULL;
      END IF;
      RETURN '***' || RIGHT(p_value, 4);
    WHEN 'sensitive' THEN
      RETURN '***';
    ELSE
      RETURN p_value;
  END CASE;
END;
$function$;