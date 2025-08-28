-- Add admin response fields to product_reviews table
ALTER TABLE public.product_reviews 
ADD COLUMN admin_response TEXT,
ADD COLUMN admin_response_date TIMESTAMP WITH TIME ZONE;