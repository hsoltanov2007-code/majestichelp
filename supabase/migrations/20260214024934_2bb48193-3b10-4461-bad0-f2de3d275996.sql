
-- Add telegram_chat_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;

-- Create telegram_link_codes table
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Users can create their own link codes
CREATE POLICY "Users can create own link codes"
  ON public.telegram_link_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own link codes
CREATE POLICY "Users can view own link codes"
  ON public.telegram_link_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own link codes
CREATE POLICY "Users can delete own link codes"
  ON public.telegram_link_codes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role needs full access for the bot to consume codes
-- The edge function uses service role key, so RLS is bypassed anyway

-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to send Telegram notifications
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chat_id bigint;
  msg_text text;
  notification_type text;
  supabase_url text;
  anon_key text;
BEGIN
  notification_type := NEW.type;
  
  -- Get the user's telegram_chat_id
  SELECT p.telegram_chat_id INTO chat_id
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  
  -- If no telegram linked, skip
  IF chat_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Build message based on notification type
  CASE notification_type
    WHEN 'new_entry' THEN
      msg_text := '📋 Новая заявка на розыгрыш!';
    WHEN 'new_topic_admin' THEN
      msg_text := '💬 Новая тема на форуме!';
    WHEN 'new_ticket' THEN
      msg_text := '🎫 Новый тикет поддержки!';
    WHEN 'new_comment' THEN
      msg_text := '💬 Новый комментарий к вашей теме!';
    WHEN 'giveaway_winner' THEN
      msg_text := '🎉 Поздравляем! Вы выиграли розыгрыш!';
    WHEN 'new_giveaway' THEN
      msg_text := '🎁 Новый розыгрыш на сайте!';
    WHEN 'new_video' THEN
      msg_text := '🎬 Новое видео на сайте!';
    WHEN 'ticket_reply' THEN
      msg_text := '📩 Новый ответ на ваш тикет поддержки!';
    ELSE
      msg_text := '🔔 Новое уведомление на Hardy Help!';
  END CASE;
  
  -- Get Supabase URL and anon key from vault/env
  supabase_url := current_setting('app.settings.supabase_url', true);
  anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- If settings not available, try to use hardcoded project URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://irdylmsqtnsgdlmoqqof.supabase.co';
  END IF;
  
  IF anon_key IS NULL OR anon_key = '' THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHlsbXNxdG5zZ2RsbW9xcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTAxOTMsImV4cCI6MjA4MTY2NjE5M30.4k3pysKDUfqrjlqOPlmXTw9DEbC2IRHKwRC0XCJ9PNY';
  END IF;
  
  -- Call telegram-send edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/telegram-send',
    body := json_build_object('chat_id', chat_id, 'text', msg_text)::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on forum_notifications
DROP TRIGGER IF EXISTS on_notification_send_telegram ON public.forum_notifications;
CREATE TRIGGER on_notification_send_telegram
  AFTER INSERT ON public.forum_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification();
