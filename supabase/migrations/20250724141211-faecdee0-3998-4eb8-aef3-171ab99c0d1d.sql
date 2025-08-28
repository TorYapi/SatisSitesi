-- Check all auth users and manually insert missing ones
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get all auth users that don't have customer records
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
        FROM auth.users u
        LEFT JOIN public.customers c ON u.id = c.user_id
        WHERE c.user_id IS NULL
    LOOP
        -- Insert customer record for each missing user
        INSERT INTO public.customers (user_id, email, first_name, last_name, created_at)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
            COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
            user_record.created_at
        );
        
        RAISE NOTICE 'Created customer record for user: %', user_record.email;
    END LOOP;
END $$;