
CREATE TABLE public.redux_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redux_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redux categories viewable by everyone"
  ON public.redux_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage redux categories"
  ON public.redux_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Seed default categories
INSERT INTO public.redux_categories (value, label, order_index) VALUES
  ('redux', 'Редуксы', 0),
  ('gunpack', 'Ганпаки', 1),
  ('clothes', 'Одежда', 2),
  ('world', 'Мир', 3),
  ('builds', 'Сборки', 4),
  ('guides', 'Гайды', 5),
  ('other', 'Другое', 6);
