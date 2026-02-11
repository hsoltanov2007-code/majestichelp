
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Giveaways viewable by everyone" ON public.giveaways;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage giveaways"
ON public.giveaways
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Giveaways viewable by everyone"
ON public.giveaways
FOR SELECT
TO public
USING (true);
