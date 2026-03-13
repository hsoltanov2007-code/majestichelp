
-- Code sources table (stores the 4 forum URLs for UK, AK, DK, PK)
CREATE TABLE public.code_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legal code articles table (parsed articles from forum)
CREATE TABLE public.legal_code_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.code_sources(id) ON DELETE CASCADE NOT NULL,
  article_number TEXT NOT NULL,
  article_title TEXT NOT NULL DEFAULT '',
  jurisdiction TEXT DEFAULT '',
  description TEXT DEFAULT '',
  section_name TEXT DEFAULT '',
  chapter_name TEXT DEFAULT '',
  parts JSONB DEFAULT '[]'::jsonb,
  is_void BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update logs table
CREATE TABLE public.update_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  changes JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  sources_updated INTEGER DEFAULT 0,
  articles_reparsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Raw scraped content cache
CREATE TABLE public.scraped_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.code_sources(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  scraped_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_code_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_content ENABLE ROW LEVEL SECURITY;

-- Public read for code_sources and articles
CREATE POLICY "Anyone can read code_sources" ON public.code_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can read legal_code_articles" ON public.legal_code_articles FOR SELECT USING (true);

-- Admin-only write for all tables
CREATE POLICY "Admin write code_sources" ON public.code_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write legal_code_articles" ON public.legal_code_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage update_logs" ON public.update_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage scraped_content" ON public.scraped_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role full access (for edge functions)
CREATE POLICY "Service read update_logs" ON public.update_logs FOR SELECT USING (true);

-- Insert the 4 Denver code sources
INSERT INTO public.code_sources (name, short_name, source_url, category, order_index) VALUES
  ('Уголовный кодекс штата Сан-Андреас', 'УК', 'https://forum.majestic-rp.ru/threads/ugolovnyi-kodeks-shtata-san-andreas.2579868/', 'criminal_code', 1),
  ('Административный кодекс штата Сан-Андреас', 'АК', 'https://forum.majestic-rp.ru/threads/administrativnyi-kodeks-shtata-san-andreas.2579869/', 'administrative_code', 2),
  ('Дорожный кодекс штата Сан-Андреас', 'ДК', 'https://forum.majestic-rp.ru/threads/dorozhnyi-kodeks-shtata-san-andreas.2579876/', 'traffic_code', 3),
  ('Процессуальный кодекс штата Сан-Андреас', 'ПК', 'https://forum.majestic-rp.ru/threads/protsessual-nyi-kodeks-shtata-san-andreas.2579857/', 'procedural_code', 4);

-- Index for faster lookups
CREATE INDEX idx_legal_articles_source ON public.legal_code_articles(source_id);
CREATE INDEX idx_legal_articles_number ON public.legal_code_articles(article_number);
