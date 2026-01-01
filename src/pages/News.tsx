import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import hardyLogo from "@/assets/hardy-logo.png";

interface NewsItem {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  author_avatar: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  source_channel: string | null;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

interface UserReaction {
  news_id: string;
  reaction_type: 'like' | 'dislike';
}

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (text: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Format markdown-like text to JSX
const formatContent = (text: string): React.ReactNode => {
  // Split by lines to handle each line
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Process each line for formatting
    const formattedLine = formatLine(line);
    
    return (
      <span key={lineIndex}>
        {formattedLine}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

const formatLine = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // Bold text **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-bold text-primary">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    
    // Italic text *text*
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }
    
    // URL links
    const urlMatch = remaining.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch && urlMatch.index !== undefined) {
      if (urlMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, urlMatch.index)}</span>);
      }
      parts.push(
        <a 
          key={key++} 
          href={urlMatch[1]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {urlMatch[1]}
        </a>
      );
      remaining = remaining.slice(urlMatch.index + urlMatch[0].length);
      continue;
    }
    
    // No more matches, add remaining text
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  
  return parts;
};

// YouTube Embed Component
const YouTubeEmbed = ({ videoId }: { videoId: string }) => (
  <div className="aspect-video rounded-lg overflow-hidden my-4 border border-border/50">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  </div>
);

// Image Gallery Component for multiple images
const ImageGallery = ({ images, title }: { images: string[], title?: string | null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (images.length === 0) return null;
  
  if (images.length === 1) {
    return (
      <div className="aspect-video overflow-hidden">
        <img
          src={images[0]}
          alt={title || 'Новость'}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
    );
  }
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="relative aspect-video overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt={`${title || 'Новость'} - изображение ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-500"
      />
      
      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Предыдущее изображение"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Следующее изображение"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      
      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Перейти к изображению ${idx + 1}`}
          />
        ))}
      </div>
      
      {/* Counter */}
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

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
          <h1 className="text-3xl font-bold mb-8">HARDY NEWS</h1>
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
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg shadow-accent/20">
            <img src={hardyLogo} alt="HARDY" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">HARDY NEWS</h1>
            <p className="text-muted-foreground">
              Последние новости и обновления Majestic RP
            </p>
          </div>
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
              const youtubeId = extractYouTubeId(item.content);
              // Use image_urls if available, fallback to image_url
              const images = (item.image_urls && item.image_urls.length > 0) 
                ? item.image_urls 
                : (item.image_url ? [item.image_url] : []);
              
              return (
                <Card key={item.id} className="glass-card overflow-hidden hover:shadow-lg hover:shadow-accent/10 transition-all duration-300">
                  {images.length > 0 && (
                    <ImageGallery images={images} title={item.title} />
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30">
                        <img
                          src={hardyLogo}
                          alt="HARDY NEWS"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-accent">HARDY NEWS</p>
                          <Newspaper className="h-4 w-4 text-accent/70" />
                        </div>
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
                      <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="text-foreground/90 leading-relaxed">
                      {formatContent(item.content)}
                    </div>
                    
                    {youtubeId && <YouTubeEmbed videoId={youtubeId} />}
                  </CardContent>
                  
                  <CardFooter className="border-t border-border/50 pt-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={userReaction === 'like' ? 'default' : 'ghost'}
                        size="sm"
                        className={`gap-2 transition-all ${userReaction === 'like' ? 'bg-green-600 hover:bg-green-700 scale-105' : 'hover:bg-green-600/20'}`}
                        onClick={() => handleReaction(item.id, 'like')}
                        disabled={reacting === item.id}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{item.likes_count}</span>
                      </Button>
                      
                      <Button
                        variant={userReaction === 'dislike' ? 'default' : 'ghost'}
                        size="sm"
                        className={`gap-2 transition-all ${userReaction === 'dislike' ? 'bg-red-600 hover:bg-red-700 scale-105' : 'hover:bg-red-600/20'}`}
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
