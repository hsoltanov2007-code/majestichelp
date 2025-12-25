-- Enable realtime for media_videos table
ALTER TABLE public.media_videos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_videos;