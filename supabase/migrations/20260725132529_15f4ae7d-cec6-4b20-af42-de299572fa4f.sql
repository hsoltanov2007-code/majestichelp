
CREATE TABLE public.image_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  files text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.image_uploads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_uploads TO authenticated;
GRANT ALL ON public.image_uploads TO service_role;

ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-expired uploads" ON public.image_uploads
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Authenticated users can create uploads" ON public.image_uploads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or admin can update" ON public.image_uploads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin can delete" ON public.image_uploads
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_image_uploads_slug ON public.image_uploads(slug);
CREATE INDEX idx_image_uploads_user ON public.image_uploads(user_id);
CREATE INDEX idx_image_uploads_expires ON public.image_uploads(expires_at);

-- Storage policies for image-hosting bucket
CREATE POLICY "Public can view image-hosting files" ON storage.objects
  FOR SELECT USING (bucket_id = 'image-hosting');

CREATE POLICY "Authenticated can upload to image-hosting" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'image-hosting' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner can delete own image-hosting files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'image-hosting' AND (storage.foldername(name))[1] = auth.uid()::text
  );
