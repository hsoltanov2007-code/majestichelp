-- Create notifications table
CREATE TABLE public.forum_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_comment', 'topic_reply')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.forum_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.forum_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.forum_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.forum_notifications
FOR INSERT
WITH CHECK (true);

-- Function to create notification when a comment is added
CREATE OR REPLACE FUNCTION public.notify_topic_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic_author_id uuid;
BEGIN
  -- Get the topic author
  SELECT author_id INTO topic_author_id
  FROM public.forum_topics
  WHERE id = NEW.topic_id;
  
  -- Don't notify if the commenter is the topic author
  IF topic_author_id IS NOT NULL AND topic_author_id != NEW.author_id THEN
    INSERT INTO public.forum_notifications (user_id, topic_id, comment_id, type)
    VALUES (topic_author_id, NEW.topic_id, NEW.id, 'new_comment');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to notify topic author on new comment
CREATE TRIGGER on_new_comment_notify
AFTER INSERT ON public.forum_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_topic_author();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_notifications;