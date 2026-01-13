-- Update forum_categories policy to allow moderators
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.forum_categories;
CREATE POLICY "Admins and moderators can manage categories" 
ON public.forum_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Update discord_news policies to allow moderators
DROP POLICY IF EXISTS "Admins can insert news" ON public.discord_news;
CREATE POLICY "Admins and moderators can insert news" 
ON public.discord_news 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins can update news" ON public.discord_news;
CREATE POLICY "Admins and moderators can update news" 
ON public.discord_news 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Admins can delete news" ON public.discord_news;
CREATE POLICY "Admins and moderators can delete news" 
ON public.discord_news 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Update media_videos policies to allow moderators
DROP POLICY IF EXISTS "Only admins can insert videos" ON public.media_videos;
CREATE POLICY "Admins and moderators can insert videos" 
ON public.media_videos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Only admins can update videos" ON public.media_videos;
CREATE POLICY "Admins and moderators can update videos" 
ON public.media_videos 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Only admins can delete videos" ON public.media_videos;
CREATE POLICY "Admins and moderators can delete videos" 
ON public.media_videos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));