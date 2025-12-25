-- Add video_id column to forum_notifications for video notifications
ALTER TABLE public.forum_notifications ADD COLUMN video_id UUID REFERENCES public.media_videos(id) ON DELETE CASCADE;

-- Create function to notify all users about new video
CREATE OR REPLACE FUNCTION public.notify_new_video()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Notify all users except the video author
  FOR user_record IN SELECT id FROM profiles WHERE id != NEW.author_id
  LOOP
    INSERT INTO public.forum_notifications (user_id, video_id, type)
    VALUES (user_record.id, NEW.id, 'new_video');
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new video notifications
CREATE TRIGGER notify_on_new_video
AFTER INSERT ON public.media_videos
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_video();