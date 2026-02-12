
-- Create redux_items table
CREATE TABLE public.redux_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_urls TEXT[] DEFAULT '{}'::TEXT[],
  download_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.redux_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redux items viewable by everyone"
ON public.redux_items FOR SELECT
USING (true);

CREATE POLICY "Admins can manage redux items"
ON public.redux_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_redux_items_updated_at
BEFORE UPDATE ON public.redux_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for redux files and images
INSERT INTO storage.buckets (id, name, public) VALUES ('redux-files', 'redux-files', true);

CREATE POLICY "Redux files publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'redux-files');

CREATE POLICY "Admins can upload redux files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'redux-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));

CREATE POLICY "Admins can update redux files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'redux-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));

CREATE POLICY "Admins can delete redux files"
ON storage.objects FOR DELETE
USING (bucket_id = 'redux-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));
