-- Create brands table for product brands
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cart table for shopping cart
CREATE TABLE public.cart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT, -- For guest users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT cart_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Create cart_items table for cart items
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  UNIQUE(cart_id, variant_id)
);

-- Create product_reviews table for product reviews
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Create coupons table for discount coupons
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_products UUID[],
  applicable_categories UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create coupon_usages table to track coupon usage
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(coupon_id, user_id, order_id)
);

-- Create notifications table for user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_attributes table for additional product properties
CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'boolean', 'select')),
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_attribute_values table for product attribute values
CREATE TABLE public.product_attribute_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- Create wishlist table (additional to favorites)
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Wishlist',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wishlist_items table
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(wishlist_id, product_id)
);

-- Add brand_id to products table
ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_cart_session_id ON public.cart(session_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_product_attributes_category ON public.product_attributes(category_id);
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_products_brand_id ON public.products(brand_id);

-- Enable RLS on all new tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brands
CREATE POLICY "Public can view active brands" ON public.brands
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage brands" ON public.brands
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for cart
CREATE POLICY "Users can manage their own cart" ON public.cart
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Guest carts by session" ON public.cart
FOR ALL USING (session_id IS NOT NULL AND user_id IS NULL);

-- RLS Policies for cart_items
CREATE POLICY "Users can manage their cart items" ON public.cart_items
FOR ALL USING (
  cart_id IN (
    SELECT id FROM public.cart 
    WHERE user_id = auth.uid() OR (session_id IS NOT NULL AND user_id IS NULL)
  )
);

-- RLS Policies for product_reviews
CREATE POLICY "Public can view approved reviews" ON public.product_reviews
FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create their own reviews" ON public.product_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.product_reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.product_reviews
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.product_reviews
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for coupons
CREATE POLICY "Public can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until >= now()));

CREATE POLICY "Admins can manage coupons" ON public.coupons
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for coupon_usages
CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usages
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coupon usage" ON public.coupon_usages
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usages
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for product_attributes
CREATE POLICY "Public can view product attributes" ON public.product_attributes
FOR SELECT USING (true);

CREATE POLICY "Admins can manage product attributes" ON public.product_attributes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for product_attribute_values
CREATE POLICY "Public can view product attribute values" ON public.product_attribute_values
FOR SELECT USING (true);

CREATE POLICY "Admins can manage product attribute values" ON public.product_attribute_values
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for wishlists
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view public wishlists" ON public.wishlists
FOR SELECT USING (is_public = true);

-- RLS Policies for wishlist_items
CREATE POLICY "Users can manage their wishlist items" ON public.wishlist_items
FOR ALL USING (
  wishlist_id IN (
    SELECT id FROM public.wishlists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can view public wishlist items" ON public.wishlist_items
FOR SELECT USING (
  wishlist_id IN (
    SELECT id FROM public.wishlists WHERE is_public = true
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_updated_at
BEFORE UPDATE ON public.cart
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at
BEFORE UPDATE ON public.wishlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();