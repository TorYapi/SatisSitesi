-- Enable realtime for settings table
ALTER TABLE public.settings REPLICA IDENTITY FULL;

-- Add the settings table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;