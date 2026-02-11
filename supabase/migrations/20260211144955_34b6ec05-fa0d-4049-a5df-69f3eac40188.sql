
ALTER TABLE public.forum_notifications
  DROP CONSTRAINT IF EXISTS forum_notifications_type_check;

ALTER TABLE public.forum_notifications
  ADD CONSTRAINT forum_notifications_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'new_comment'::text,
        'topic_reply'::text,
        'new_video'::text,
        'new_giveaway'::text,
        'giveaway_winner'::text
      ]
    )
  );
