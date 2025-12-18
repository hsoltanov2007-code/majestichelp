-- Create table for visitor tracking
CREATE TABLE public.site_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (track visitors)
CREATE POLICY "Anyone can register as visitor" 
ON public.site_visitors 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update their own session
CREATE POLICY "Anyone can update their session" 
ON public.site_visitors 
FOR UPDATE 
USING (true);

-- Allow anyone to read visitor count
CREATE POLICY "Anyone can read visitors" 
ON public.site_visitors 
FOR SELECT 
USING (true);

-- Create index for efficient queries
CREATE INDEX idx_site_visitors_last_seen ON public.site_visitors(last_seen_at);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visitors;