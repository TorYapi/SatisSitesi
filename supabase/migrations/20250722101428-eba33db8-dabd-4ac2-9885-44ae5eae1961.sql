-- Update admin signup function to only use ugurcan-231@hotmail.com as admin email
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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