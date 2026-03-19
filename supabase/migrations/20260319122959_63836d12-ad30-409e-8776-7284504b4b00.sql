ALTER TABLE public.giveaway_entries ALTER COLUMN screenshot_url SET DEFAULT 'telegram-verified';
ALTER TABLE public.giveaway_entries ALTER COLUMN screenshot_url DROP NOT NULL;