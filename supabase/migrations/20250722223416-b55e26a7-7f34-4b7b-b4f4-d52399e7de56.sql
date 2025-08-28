-- Create featured_products table for admin-controlled featured products
CREATE TABLE public.featured_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage featured products" 
ON public.featured_products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Public can view active featured products" 
ON public.featured_products 
FOR SELECT 
USING (is_active = true);

-- Create index for better performance
CREATE INDEX idx_featured_products_sort_order ON public.featured_products(sort_order);
CREATE INDEX idx_featured_products_active ON public.featured_products(is_active);