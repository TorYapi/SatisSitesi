-- Create set_config function for session management
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, new_value text, is_local boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Set the configuration parameter
  PERFORM set_config(setting_name, new_value, is_local);
END;
$function$;