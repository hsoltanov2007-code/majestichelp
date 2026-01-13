-- Таблица для хранения законов
CREATE TABLE public.laws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'law' CHECK (type IN ('law', 'code')),
  forum_url TEXT,
  preamble TEXT,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;

-- Все могут читать законы
CREATE POLICY "Laws are viewable by everyone"
ON public.laws
FOR SELECT
USING (true);

-- Только админы и модераторы могут управлять законами
CREATE POLICY "Admins and moderators can manage laws"
ON public.laws
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Триггер для обновления updated_at
CREATE TRIGGER update_laws_updated_at
BEFORE UPDATE ON public.laws
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Индекс для быстрого поиска по slug
CREATE INDEX idx_laws_slug ON public.laws(slug);
CREATE INDEX idx_laws_order ON public.laws(order_index);