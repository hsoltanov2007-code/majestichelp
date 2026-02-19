
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  supabase_url := 'https://irdylmsqtnsgdlmoqqof.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHlsbXNxdG5zZ2RsbW9xcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTAxOTMsImV4cCI6MjA4MTY2NjE5M30.4k3pysKDUfqrjlqOPlmXTw9DEbC2IRHKwRC0XCJ9PNY';
  
  -- Call telegram-send edge function via net.http_post (pg_net)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/telegram-send',
    body := json_build_object('chat_id', chat_id, 'text', msg_text)::jsonb,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;
