-- Insert existing auth users who don't have customer records
INSERT INTO public.customers (user_id, email, first_name, last_name, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  u.created_at
FROM auth.users u
LEFT JOIN public.customers c ON u.id = c.user_id
WHERE c.user_id IS NULL
AND u.created_at >= CURRENT_DATE;