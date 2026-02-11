
-- Add screenshot_urls array column for multiple file support
ALTER TABLE public.giveaway_entries ADD COLUMN screenshot_urls text[] DEFAULT '{}';

-- Migrate existing data: copy screenshot_url into screenshot_urls array
UPDATE public.giveaway_entries SET screenshot_urls = ARRAY[screenshot_url] WHERE screenshot_url IS NOT NULL AND screenshot_url != '';
