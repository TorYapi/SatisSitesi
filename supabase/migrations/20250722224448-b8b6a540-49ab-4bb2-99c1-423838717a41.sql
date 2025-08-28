-- Create orders table to track purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || substring(gen_random_uuid()::text, 1, 8),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  shipping_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method TEXT,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  billing_address JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  notes TEXT,
  tracking_number TEXT,
  delivery_date TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_personnel_id UUID REFERENCES public.delivery_personnel(id),
  delivery_status delivery_status,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can create orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update orders"
  ON public.orders
  FOR UPDATE
  USING (true);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order items
CREATE POLICY "Users can view their order items"
  ON public.order_items
  FOR SELECT
  USING (order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all order items"
  ON public.order_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System can create order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Create function to update stock when order is completed
CREATE OR REPLACE FUNCTION public.update_stock_on_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when order status changes to 'completed' or 'delivered'
  -- and payment status is 'paid'
  IF (NEW.status IN ('completed', 'delivered') AND NEW.payment_status = 'paid') 
     AND (OLD.status NOT IN ('completed', 'delivered') OR OLD.payment_status != 'paid') THEN
    
    -- Update stock for each order item
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity - oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id 
      AND public.product_variants.id = oi.variant_id
      AND stock_quantity >= oi.quantity; -- Ensure we don't go negative
    
    -- Log if any variants don't have enough stock
    IF FOUND = FALSE THEN
      RAISE WARNING 'Some variants may not have sufficient stock for order %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock when order is completed
CREATE TRIGGER update_stock_on_order_completion_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_order_completion();

-- Create function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_order_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when order status changes to 'cancelled' from completed/delivered
  IF NEW.status = 'cancelled' AND OLD.status IN ('completed', 'delivered') 
     AND OLD.payment_status = 'paid' THEN
    
    -- Restore stock for each order item
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity + oi.quantity,
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id 
      AND public.product_variants.id = oi.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to restore stock when order is cancelled
CREATE TRIGGER restore_stock_on_order_cancellation_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_order_cancellation();

-- Add trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();