-- Fix critical role escalation vulnerability in user_roles table
-- Drop existing insufficient policies
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;

-- Create secure policies for user_roles table
-- Users can only view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Only admins and managers can insert user roles
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only admins and managers can update user roles
CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only admins and managers can delete user roles
CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Ensure customers table has proper constraints to prevent data integrity issues
-- Make user_id NOT NULL to prevent orphaned customer records
ALTER TABLE public.customers 
ALTER COLUMN user_id SET NOT NULL;

-- Add policy to allow admins to manage all customer records
CREATE POLICY "Admins can manage all customers" 
ON public.customers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Fix potential security issue in cart table - ensure session_id validation
-- Add constraint to ensure either user_id or session_id is present, but not both
ALTER TABLE public.cart 
ADD CONSTRAINT cart_user_or_session_check 
CHECK (
  (user_id IS NOT NULL AND session_id IS NULL) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Add policy for admins to manage all carts for support purposes
CREATE POLICY "Admins can manage all carts" 
ON public.cart 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Ensure order security - add policy for admins to manage all orders
CREATE POLICY "Admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Fix notification security - prevent users from creating notifications for others
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only allow admins to create notifications
CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));