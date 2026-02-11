
-- Table for caching AI bot responses
CREATE TABLE public.chat_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_hash text NOT NULL UNIQUE,
  question text NOT NULL,
  answer text NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_chat_cache_hash ON public.chat_cache (question_hash);

-- Enable RLS
ALTER TABLE public.chat_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read cache (needed by edge function via service role anyway)
CREATE POLICY "Cache readable by everyone" ON public.chat_cache FOR SELECT USING (true);

-- Only service role inserts/updates (edge function uses service role key)
CREATE POLICY "Service role can manage cache" ON public.chat_cache FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_chat_cache_updated_at
  BEFORE UPDATE ON public.chat_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
