
-- Replace overly permissive policy with admin-only management
DROP POLICY "Service role can manage cache" ON public.chat_cache;

CREATE POLICY "Admins can manage cache" ON public.chat_cache 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert for anyone (edge function uses service role, bypasses RLS anyway)
-- The edge function will use the service role key which bypasses RLS
