-- Security Fix Phase 1: Cart Privacy Issue
-- Fix RLS policies for cart table to ensure proper session isolation

-- Drop existing problematic policy for guest carts
DROP POLICY IF EXISTS "Guest carts by session" ON public.cart;

-- Create new secure policy for guest carts that validates session ownership
CREATE POLICY "Guest carts by session - secure" 
ON public.cart 
FOR ALL 
USING (
  (session_id IS NOT NULL) 
  AND (user_id IS NULL) 
  AND (session_id = current_setting('request.headers')::json->>'x-session-id', true)
);

-- Also update cart_items policy to be more explicit about session validation
DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;

-- Create separate policies for authenticated and guest users
CREATE POLICY "Authenticated users can manage their cart items" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT cart.id 
    FROM cart 
    WHERE cart.user_id = auth.uid()
  )
);

CREATE POLICY "Guest users can manage their session cart items" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT cart.id 
    FROM cart 
    WHERE cart.session_id IS NOT NULL 
      AND cart.user_id IS NULL
      AND cart.session_id = current_setting('request.headers')::json->>'x-session-id', true
  )
);