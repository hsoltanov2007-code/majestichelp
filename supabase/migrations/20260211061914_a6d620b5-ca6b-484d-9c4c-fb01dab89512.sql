
-- 1. Create giveaway_comments table
CREATE TABLE public.giveaway_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.giveaway_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone" ON public.giveaway_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments" ON public.giveaway_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors and admins can delete comments" ON public.giveaway_comments FOR DELETE USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Create giveaway_reactions table
CREATE TABLE public.giveaway_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id, reaction_type)
);

ALTER TABLE public.giveaway_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone" ON public.giveaway_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can react" ON public.giveaway_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.giveaway_reactions FOR DELETE USING (auth.uid() = user_id);

-- 3. Add giveaway_id to forum_notifications
ALTER TABLE public.forum_notifications ADD COLUMN giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE;

-- 4. Trigger: notify all users on new giveaway
CREATE OR REPLACE FUNCTION public.notify_new_giveaway()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF NEW.status = 'active' THEN
    FOR user_record IN SELECT id FROM profiles
    LOOP
      INSERT INTO public.forum_notifications (user_id, giveaway_id, type)
      VALUES (user_record.id, NEW.id, 'new_giveaway');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_giveaway
AFTER INSERT ON public.giveaways
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_giveaway();

-- 5. Trigger: notify winner
CREATE OR REPLACE FUNCTION public.notify_giveaway_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.winner_id IS NULL AND NEW.winner_id IS NOT NULL THEN
    INSERT INTO public.forum_notifications (user_id, giveaway_id, type)
    VALUES (NEW.winner_id, NEW.id, 'giveaway_winner');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_giveaway_winner
AFTER UPDATE ON public.giveaways
FOR EACH ROW
EXECUTE FUNCTION public.notify_giveaway_winner();

-- 6. Enable realtime for giveaway_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.giveaway_comments;
