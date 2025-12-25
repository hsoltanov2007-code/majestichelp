-- Create media_videos table for storing video posts
CREATE TABLE public.media_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  author_id UUID NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_video_likes table for tracking likes
CREATE TABLE public.media_video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.media_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create media_video_views table for tracking who viewed/clicked
CREATE TABLE public.media_video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.media_videos(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  view_type TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.media_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_video_views ENABLE ROW LEVEL SECURITY;

-- RLS for media_videos: everyone can view, only admins can manage
CREATE POLICY "Videos are viewable by everyone" 
ON public.media_videos 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert videos" 
ON public.media_videos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update videos" 
ON public.media_videos 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete videos" 
ON public.media_videos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for media_video_likes: users can like/unlike, everyone can see likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.media_video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like" 
ON public.media_video_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes" 
ON public.media_video_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for media_video_views: anyone can record views
CREATE POLICY "Views are viewable by admins" 
ON public.media_video_views 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can record views" 
ON public.media_video_views 
FOR INSERT 
WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_video_view(p_video_id UUID, p_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.media_video_views (video_id, user_id, session_id, view_type)
  VALUES (p_video_id, auth.uid(), p_session_id, 'view');
  
  UPDATE public.media_videos 
  SET views_count = views_count + 1 
  WHERE id = p_video_id;
END;
$$;

-- Function to increment click count (when user clicks to watch)
CREATE OR REPLACE FUNCTION public.increment_video_click(p_video_id UUID, p_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.media_video_views (video_id, user_id, session_id, view_type)
  VALUES (p_video_id, auth.uid(), p_session_id, 'click');
  
  UPDATE public.media_videos 
  SET clicks_count = clicks_count + 1 
  WHERE id = p_video_id;
END;
$$;

-- Create trigger for updating updated_at on media_videos
CREATE TRIGGER update_media_videos_updated_at
BEFORE UPDATE ON public.media_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();