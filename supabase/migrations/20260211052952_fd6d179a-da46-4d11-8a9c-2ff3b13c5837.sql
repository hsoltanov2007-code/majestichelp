
-- Таблица розыгрышей
CREATE TABLE public.giveaways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_id UUID,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица участников
CREATE TABLE public.giveaway_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

-- RLS
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Giveaways policies
CREATE POLICY "Giveaways viewable by everyone" ON public.giveaways FOR SELECT USING (true);
CREATE POLICY "Admins can manage giveaways" ON public.giveaways FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- Entries policies
CREATE POLICY "Entries viewable by everyone" ON public.giveaway_entries FOR SELECT USING (true);
CREATE POLICY "Auth users can enter" ON public.giveaway_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage entries" ON public.giveaway_entries FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);
CREATE POLICY "Users can delete own entry" ON public.giveaway_entries FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_giveaways_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('giveaway-screenshots', 'giveaway-screenshots', true);

CREATE POLICY "Auth users can upload screenshots" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'giveaway-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Screenshots are public" ON storage.objects FOR SELECT
  USING (bucket_id = 'giveaway-screenshots');
