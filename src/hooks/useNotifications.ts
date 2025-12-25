import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  user_id: string;
  topic_id: string | null;
  comment_id: string | null;
  video_id: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  topic?: {
    title: string;
  };
  video?: {
    title: string;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('forum_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch topic/video titles
      const notificationsWithDetails: Notification[] = await Promise.all(
        (data || []).map(async (notification) => {
          let topic: { title: string } | undefined;
          let video: { title: string } | undefined;
          
          if (notification.topic_id) {
            const { data: topicData } = await supabase
              .from('forum_topics')
              .select('title')
              .eq('id', notification.topic_id)
              .maybeSingle();
            topic = topicData || undefined;
          }
          
          if (notification.video_id) {
            const { data: videoData } = await supabase
              .from('media_videos')
              .select('title')
              .eq('id', notification.video_id)
              .maybeSingle();
            video = videoData || undefined;
          }
          
          return {
            id: notification.id,
            user_id: notification.user_id,
            topic_id: notification.topic_id,
            comment_id: notification.comment_id,
            video_id: notification.video_id,
            type: notification.type,
            is_read: notification.is_read || false,
            created_at: notification.created_at || '',
            topic,
            video,
          };
        })
      );

      setNotifications(notificationsWithDetails);
      setUnreadCount(notificationsWithDetails.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('forum_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find((n) => n.id === notificationId);
      const { error } = await supabase
        .from('forum_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
