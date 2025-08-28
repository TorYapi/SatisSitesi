-- Create audit logging table for customer data access
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  customer_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies for audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Create function to log customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  p_action_type TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_customer_data JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to get customers with audit logging
CREATE OR REPLACE FUNCTION public.get_customers_with_audit(
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'manager'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Log the access
  PERFORM log_customer_access(
    'SELECT_CUSTOMERS',
    'customers',
    NULL,
    jsonb_build_object(
      'limit', p_limit,
      'offset', p_offset,
      'admin_id', auth.uid()
    )
  );

  -- Return customer data with sensitive fields masked for managers
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.first_name,
    c.last_name,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN c.email
      ELSE SUBSTRING(c.email FROM 1 FOR 3) || '***@' || SPLIT_PART(c.email, '@', 2)
    END as email,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN c.phone
      ELSE CASE WHEN c.phone IS NOT NULL THEN '***' || RIGHT(c.phone, 4) ELSE NULL END
    END as phone,
    c.created_at
  FROM public.customers c
  ORDER BY c.created_at DESC
  LIMIT COALESCE(p_limit, 100)
  OFFSET p_offset;
END;
$$;

-- Create function to get single customer with audit logging
CREATE OR REPLACE FUNCTION public.get_customer_by_id_with_audit(p_customer_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  tax_number TEXT,
  is_corporate BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'manager'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get customer data
  SELECT * INTO customer_record FROM public.customers WHERE customers.id = p_customer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Log the access with sensitive data
  PERFORM log_customer_access(
    'SELECT_CUSTOMER_DETAILS',
    'customers',
    p_customer_id,
    to_jsonb(customer_record)
  );

  -- Return customer data with field-level access control
  RETURN QUERY
  SELECT 
    customer_record.id,
    customer_record.user_id,
    customer_record.first_name,
    customer_record.last_name,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_record.email
      ELSE SUBSTRING(customer_record.email FROM 1 FOR 3) || '***@' || SPLIT_PART(customer_record.email, '@', 2)
    END as email,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_record.phone
      ELSE CASE WHEN customer_record.phone IS NOT NULL THEN '***' || RIGHT(customer_record.phone, 4) ELSE NULL END
    END as phone,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_record.company_name
      ELSE '***'
    END as company_name,
    CASE 
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_record.tax_number
      ELSE '***'
    END as tax_number,
    customer_record.is_corporate,
    customer_record.created_at;
END;
$$;