-- Add image_urls array column and migrate existing data
ALTER TABLE public.discord_news 
ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url to array
UPDATE public.discord_news 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Keep image_url for backwards compatibility (first image)