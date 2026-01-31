-- Create table for storing parsed forum content
CREATE TABLE public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'laws',
  parsed_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Anyone can read knowledge base
CREATE POLICY "Knowledge base is viewable by everyone"
ON public.knowledge_base
FOR SELECT
USING (true);

-- Only admins/moderators can manage
CREATE POLICY "Admins and moderators can manage knowledge base"
ON public.knowledge_base
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_source ON public.knowledge_base(source_url);

-- Add trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();