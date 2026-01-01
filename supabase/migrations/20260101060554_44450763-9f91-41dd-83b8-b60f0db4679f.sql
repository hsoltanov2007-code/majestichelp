-- Create discord_news table
CREATE TABLE public.discord_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Majestic RP',
  author_avatar TEXT,
  discord_message_id TEXT UNIQUE,
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  source_channel TEXT DEFAULT 'Новости Majestic RP',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discord_news ENABLE ROW LEVEL SECURITY;

-- Everyone can read news
CREATE POLICY "News are viewable by everyone"
ON public.discord_news
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Only admins can manage news"
ON public.discord_news
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for news reactions (likes/dislikes)
CREATE TABLE public.discord_news_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.discord_news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (news_id, user_id)
);

-- Enable RLS
ALTER TABLE public.discord_news_reactions ENABLE ROW LEVEL SECURITY;

-- Everyone can view reactions
CREATE POLICY "Reactions are viewable by everyone"
ON public.discord_news_reactions
FOR SELECT
USING (true);

-- Authenticated users can add their reactions
CREATE POLICY "Authenticated users can react"
ON public.discord_news_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
ON public.discord_news_reactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON public.discord_news_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION public.update_news_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.discord_news SET likes_count = likes_count + 1 WHERE id = NEW.news_id;
    ELSE
      UPDATE public.discord_news SET dislikes_count = dislikes_count + 1 WHERE id = NEW.news_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.discord_news SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.news_id;
    ELSE
      UPDATE public.discord_news SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.news_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE public.discord_news SET likes_count = GREATEST(likes_count - 1, 0), dislikes_count = dislikes_count + 1 WHERE id = NEW.news_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE public.discord_news SET dislikes_count = GREATEST(dislikes_count - 1, 0), likes_count = likes_count + 1 WHERE id = NEW.news_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for reaction counts
CREATE TRIGGER on_news_reaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.discord_news_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_news_reaction_counts();

-- Trigger for updated_at
CREATE TRIGGER update_discord_news_updated_at
BEFORE UPDATE ON public.discord_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.discord_news;