
-- Add expires_at to user_roles for time-limited roles like subscriber
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;

-- Create a function to clean up expired subscriptions (run by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- Schedule cleanup every hour via pg_cron
SELECT cron.schedule(
  'cleanup-expired-subscriptions',
  '0 * * * *',
  $$SELECT public.cleanup_expired_subscriptions()$$
);
