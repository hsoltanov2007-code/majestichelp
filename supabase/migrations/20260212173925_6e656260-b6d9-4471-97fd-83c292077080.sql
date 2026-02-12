
-- Add restricted flag to redux_categories
ALTER TABLE public.redux_categories ADD COLUMN is_restricted boolean NOT NULL DEFAULT false;

-- Junction table: which users can see which restricted categories
CREATE TABLE public.redux_category_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.redux_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_id, user_id)
);

ALTER TABLE public.redux_category_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage access
CREATE POLICY "Admins can manage category access"
ON public.redux_category_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Users can see their own access entries
CREATE POLICY "Users can view own access"
ON public.redux_category_access
FOR SELECT
USING (auth.uid() = user_id);
