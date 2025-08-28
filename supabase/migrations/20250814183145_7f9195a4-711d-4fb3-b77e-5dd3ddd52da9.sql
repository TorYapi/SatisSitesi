-- Create a function to validate session context for guest carts
CREATE OR REPLACE FUNCTION public.validate_guest_session(session_id_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Allow if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    RETURN true;
  END IF;
  
  -- For guest users, validate session matches current setting
  RETURN session_id_param = current_setting('app.session_id', true);
END;
$function$;

-- Update cart RLS policies to use the validation function
DROP POLICY IF EXISTS "Guest carts by session - validated" ON public.cart;
DROP POLICY IF EXISTS "Guest users can manage validated session cart items" ON public.cart_items;

-- Secure cart policy for guest sessions
CREATE POLICY "Guest carts by session - secure" 
ON public.cart 
FOR ALL 
USING (
  (user_id = auth.uid()) OR 
  ((user_id IS NULL) AND (session_id IS NOT NULL) AND validate_guest_session(session_id))
);

-- Secure cart items policy  
CREATE POLICY "Guest users can manage secure session cart items" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT cart.id 
    FROM cart 
    WHERE (cart.user_id = auth.uid()) OR 
          ((cart.user_id IS NULL) AND (cart.session_id IS NOT NULL) AND validate_guest_session(cart.session_id))
  )
);