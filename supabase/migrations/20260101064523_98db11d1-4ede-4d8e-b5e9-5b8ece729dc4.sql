-- Drop existing restrictive policies
DROP POLICY IF EXISTS "News are viewable by everyone" ON public.discord_news;
DROP POLICY IF EXISTS "Only admins can manage news" ON public.discord_news;

-- Create permissive policies instead
CREATE POLICY "News are viewable by everyone" 
ON public.discord_news 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Admins can insert news" 
ON public.discord_news 
FOR INSERT 
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update news" 
ON public.discord_news 
FOR UPDATE 
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete news" 
ON public.discord_news 
FOR DELETE 
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix reactions table
DROP POLICY IF EXISTS "Authenticated users can react" ON public.discord_news_reactions;
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.discord_news_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.discord_news_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON public.discord_news_reactions;

CREATE POLICY "Reactions are viewable by everyone" 
ON public.discord_news_reactions 
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Authenticated users can react" 
ON public.discord_news_reactions 
FOR INSERT 
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions" 
ON public.discord_news_reactions 
FOR UPDATE 
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" 
ON public.discord_news_reactions 
FOR DELETE 
TO public
USING (auth.uid() = user_id);