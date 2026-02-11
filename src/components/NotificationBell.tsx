import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, MessageCircle, Play, Gift, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationContent = (notification: typeof notifications[0]) => {
    if (notification.type === 'new_video') {
      return {
        icon: <Play className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
        title: 'Новое видео',
        subtitle: notification.video?.title || 'Видео',
        link: '/media',
      };
    }

    if (notification.type === 'new_giveaway') {
      return {
        icon: <Gift className="h-5 w-5 text-accent shrink-0 mt-0.5" />,
        title: 'Новый розыгрыш',
        subtitle: notification.giveaway?.title || 'Розыгрыш',
        link: '/giveaways',
      };
    }

    if (notification.type === 'giveaway_winner') {
      return {
        icon: <Trophy className="h-5 w-5 text-[hsl(45_93%_55%)] shrink-0 mt-0.5" />,
        title: '🎉 Вы выиграли!',
        subtitle: notification.giveaway?.title || 'Розыгрыш',
        link: '/giveaways',
      };
    }
    
    return {
      icon: <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
      title: 'Новый комментарий',
      subtitle: notification.topic?.title || 'Тема',
      link: `/forum/topic/${notification.topic_id}`,
    };
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="mr-1 h-4 w-4" />
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Нет уведомлений</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const content = getNotificationContent(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {content.icon}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={content.link}
                          onClick={() => markAsRead(notification.id)}
                          className="block"
                        >
                          <p className="text-sm font-medium truncate">
                            {content.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {content.subtitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </p>
                        </Link>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
