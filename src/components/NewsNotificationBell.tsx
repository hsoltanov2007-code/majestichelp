import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface NewsItem {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  created_at: string;
  image_url: string | null;
}

const LAST_SEEN_KEY = 'news_last_seen';

export function NewsNotificationBell() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNews = async () => {
    const { data } = await supabase
      .from('discord_news')
      .select('id, title, content, author_name, created_at, image_url')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNews(data);
      
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (lastSeen) {
        const lastSeenDate = new Date(lastSeen);
        const unread = data.filter(item => new Date(item.created_at) > lastSeenDate).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(data.length > 0 ? data.length : 0);
      }
    }
  };

  useEffect(() => {
    fetchNews();

    // Subscribe to new news
    const channel = supabase
      .channel('news-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discord_news',
        },
        () => {
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && news.length > 0) {
      localStorage.setItem(LAST_SEEN_KEY, news[0].created_at);
      setUnreadCount(0);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-muted/80">
          <Newspaper className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-strong" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Новости
          </h3>
          <Link 
            to="/news" 
            className="text-xs text-accent hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Все новости
          </Link>
        </div>
        <ScrollArea className="h-80">
          {news.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Newspaper className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Нет новостей</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {news.map((item) => (
                <Link
                  key={item.id}
                  to="/news"
                  onClick={() => setIsOpen(false)}
                  className="block p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.title || item.content.slice(0, 50)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.content.slice(0, 100)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
