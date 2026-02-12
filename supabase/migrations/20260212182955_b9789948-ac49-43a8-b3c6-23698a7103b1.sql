
-- Add new columns to forum_notifications
ALTER TABLE public.forum_notifications ADD COLUMN entry_id uuid NULL;
ALTER TABLE public.forum_notifications ADD COLUMN ticket_id uuid NULL;

-- Drop existing CHECK constraint on type if any, then add updated one
DO $$
BEGIN
  -- Remove old check constraint if exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'forum_notifications' AND constraint_type = 'CHECK') THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.forum_notifications DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'forum_notifications' AND constraint_type = 'CHECK'
      LIMIT 1
    );
  END IF;
END $$;

-- Trigger function: notify admins on new giveaway entry
CREATE OR REPLACE FUNCTION public.notify_admins_new_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  giveaway_uuid uuid;
BEGIN
  giveaway_uuid := NEW.giveaway_id;
  FOR admin_record IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin', 'moderator')
  LOOP
    -- Don't notify if the admin is the one who submitted
    IF admin_record.user_id != NEW.user_id THEN
      INSERT INTO public.forum_notifications (user_id, type, entry_id, giveaway_id)
      VALUES (admin_record.user_id, 'new_entry', NEW.id, giveaway_uuid);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger function: notify admins on new forum topic
CREATE OR REPLACE FUNCTION public.notify_admins_new_topic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin', 'moderator')
  LOOP
    IF admin_record.user_id != NEW.author_id THEN
      INSERT INTO public.forum_notifications (user_id, type, topic_id)
      VALUES (admin_record.user_id, 'new_topic_admin', NEW.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger function: notify admins on new support ticket
CREATE OR REPLACE FUNCTION public.notify_admins_new_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin', 'moderator')
  LOOP
    IF admin_record.user_id != NEW.user_id THEN
      INSERT INTO public.forum_notifications (user_id, type, ticket_id)
      VALUES (admin_record.user_id, 'new_ticket', NEW.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_giveaway_entry
  AFTER INSERT ON public.giveaway_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_entry();

CREATE TRIGGER on_new_forum_topic
  AFTER INSERT ON public.forum_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_topic();

CREATE TRIGGER on_new_support_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_ticket();
