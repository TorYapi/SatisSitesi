-- Check if trigger exists for creating customer records
SELECT tgname, tgrelid::regclass, pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgname LIKE '%customer%' OR tgname LIKE '%profile%' OR tgname LIKE '%user%';

-- Also check for existing trigger functions
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%customer%' OR proname LIKE '%profile%' OR proname LIKE '%user%';