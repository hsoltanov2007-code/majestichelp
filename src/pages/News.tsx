import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface NewsItem {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  author_avatar: string | null;
  image_url: string | null;
  source_channel: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

interface UserReaction {
  news_id: string;
  reaction_type: 'like' | 'dislike';
}

export default function News() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [userReactions, setUserReactions] = useState<Map<string, 'like' | 'dislike'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    if (user) {
      fetchUserReactions();
    }
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discord_news'
        },
        (payload) => {
          console.log('New news item:', payload);
          setNews(prev => [payload.new as NewsItem, ...prev]);
          toast.success('Новая новость!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'discord_news'
        },
        (payload) => {
          setNews(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new as NewsItem : item
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('discord_news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Ошибка загрузки новостей');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('discord_news_reactions')
        .select('news_id, reaction_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const reactionsMap = new Map<string, 'like' | 'dislike'>();
      (data as UserReaction[])?.forEach(r => {
        reactionsMap.set(r.news_id, r.reaction_type as 'like' | 'dislike');
      });
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (newsId: string, type: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Войдите, чтобы оценивать новости');
      return;
    }

    if (reacting) return;
    setReacting(newsId);

    try {
      const currentReaction = userReactions.get(newsId);

      if (currentReaction === type) {
        // Remove reaction
        const { error } = await supabase
          .from('discord_news_reactions')
          .delete()
          .eq('news_id', newsId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserReactions(prev => {
          const newMap = new Map(prev);
          newMap.delete(newsId);
          return newMap;
        });
      } else if (currentReaction) {
        // Update reaction
        const { error } = await supabase
          .from('discord_news_reactions')
          .update({ reaction_type: type })
          .eq('news_id', newsId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserReactions(prev => new Map(prev).set(newsId, type));
      } else {
        // Insert new reaction
        const { error } = await supabase
          .from('discord_news_reactions')
          .insert({
            news_id: newsId,
            user_id: user.id,
            reaction_type: type,
          });

        if (error) throw error;

        setUserReactions(prev => new Map(prev).set(newsId, type));
      }

      // Refresh news to get updated counts
      fetchNews();
    } catch (error) {
      console.error('Error reacting:', error);
      toast.error('Ошибка при оценке');
    } finally {
      setReacting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">Новости Majestic RP</h1>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-32" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">Новости Majestic RP</h1>
          <p className="text-muted-foreground mt-2">
            Последние новости и обновления сервера
          </p>
        </div>

        {news.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Новостей пока нет</h2>
            <p className="text-muted-foreground">
              Новости появятся здесь, когда они будут опубликованы
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {news.map((item) => {
              const userReaction = userReactions.get(item.id);
              
              return (
                <Card key={item.id} className="glass-card overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title || 'Новость'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      {item.author_avatar ? (
                        <img
                          src={item.author_avatar}
                          alt={item.author_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{item.author_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                          {item.source_channel && (
                            <>
                              <span>•</span>
                              <span>{item.source_channel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.title && (
                      <h2 className="text-xl font-bold">{item.title}</h2>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <p className="whitespace-pre-wrap text-foreground/90">{item.content}</p>
                  </CardContent>
                  
                  <CardFooter className="border-t border-border/50 pt-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={userReaction === 'like' ? 'default' : 'ghost'}
                        size="sm"
                        className={`gap-2 ${userReaction === 'like' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => handleReaction(item.id, 'like')}
                        disabled={reacting === item.id}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{item.likes_count}</span>
                      </Button>
                      
                      <Button
                        variant={userReaction === 'dislike' ? 'default' : 'ghost'}
                        size="sm"
                        className={`gap-2 ${userReaction === 'dislike' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        onClick={() => handleReaction(item.id, 'dislike')}
                        disabled={reacting === item.id}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{item.dislikes_count}</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
