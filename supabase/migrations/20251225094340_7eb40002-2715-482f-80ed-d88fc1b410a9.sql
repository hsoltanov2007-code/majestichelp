-- Drop the old check constraint
ALTER TABLE public.forum_notifications DROP CONSTRAINT forum_notifications_type_check;

-- Add new check constraint that includes 'new_video'
ALTER TABLE public.forum_notifications ADD CONSTRAINT forum_notifications_type_check 
CHECK (type = ANY (ARRAY['new_comment'::text, 'topic_reply'::text, 'new_video'::text]));