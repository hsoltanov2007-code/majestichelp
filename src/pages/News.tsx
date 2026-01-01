import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, MessageSquare, ChevronLeft, ChevronRight, X, Pencil, Trash2, Save, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
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

// Lightbox Component
const Lightbox = ({ 
  images, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  images: string[]; 
  currentIndex: number; 
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt="Полноэкранный просмотр"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-white/10 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

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

// Image Gallery Component for multiple images with lightbox support
const ImageGallery = ({ 
  images, 
  title,
  onImageClick 
}: { 
  images: string[]; 
  title?: string | null;
  onImageClick: (index: number) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (images.length === 0) return null;
  
  if (images.length === 1) {
    return (
      <div 
        className="relative h-48 overflow-hidden cursor-pointer"
        onClick={() => onImageClick(0)}
      >
        <img
          src={images[0]}
          alt={title || 'Новость'}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }
  
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div 
      className="relative h-48 overflow-hidden group cursor-pointer"
      onClick={() => onImageClick(currentIndex)}
    >
      <img
        src={images[currentIndex]}
        alt={`${title || 'Новость'} - изображение ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
      
      {/* Navigation buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        aria-label="Предыдущее изображение"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
        aria-label="Следующее изображение"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex 
                ? 'bg-accent w-4' 
                : 'bg-foreground/40 hover:bg-foreground/60'
            }`}
            aria-label={`Перейти к изображению ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function News() {
  const { user, isAdmin } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [userReactions, setUserReactions] = useState<Map<string, 'like' | 'dislike'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState<string | null>(null);
  
  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Create new news state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrls, setNewImageUrls] = useState('');
  const [creating, setCreating] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
  };

  const startEditing = (item: NewsItem) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
    setEditContent(item.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('discord_news')
        .update({ 
          title: editTitle || null, 
          content: editContent 
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Новость обновлена');
      cancelEditing();
      fetchNews();
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Удалить эту новость?')) return;
    
    try {
      const { error } = await supabase
        .from('discord_news')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Новость удалена');
      setNews(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const createNews = async () => {
    if (!newContent.trim()) {
      toast.error('Введите содержание новости');
      return;
    }
    
    setCreating(true);
    try {
      // Parse image URLs (comma or newline separated)
      const imageUrlsArray = newImageUrls
        .split(/[,\n]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const { error } = await supabase
        .from('discord_news')
        .insert({
          title: newTitle.trim() || null,
          content: newContent.trim(),
          author_name: 'HARDY NEWS',
          image_urls: imageUrlsArray.length > 0 ? imageUrlsArray : [],
          image_url: imageUrlsArray[0] || null,
        });
      
      if (error) throw error;
      
      toast.success('Новость опубликована!');
      setShowCreateDialog(false);
      setNewTitle('');
      setNewContent('');
      setNewImageUrls('');
      fetchNews();
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('Ошибка при создании новости');
    } finally {
      setCreating(false);
    }
  };

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
        <div className="container py-6 max-w-2xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
        />
      )}

      {/* Create News Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать новость</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="news-title">Заголовок (опционально)</Label>
              <Input
                id="news-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Введите заголовок..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-content">Содержание *</Label>
              <Textarea
                id="news-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Текст новости... (поддерживается **жирный** и *курсив*)"
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-images">Ссылки на изображения</Label>
              <Textarea
                id="news-images"
                value={newImageUrls}
                onChange={(e) => setNewImageUrls(e.target.value)}
                placeholder="Вставьте ссылки на изображения (каждая с новой строки или через запятую)"
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Можно добавить несколько изображений
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Отмена
              </Button>
              <Button 
                onClick={createNews}
                disabled={creating || !newContent.trim()}
                className="gap-1.5"
              >
                {creating ? 'Публикация...' : 'Опубликовать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container py-6 max-w-2xl mx-auto">
        {/* Compact Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/30 shadow-md">
              <img src={hardyLogo} alt="HARDY" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">HARDY NEWS</h1>
              <p className="text-xs text-muted-foreground">Новости Majestic RP</p>
            </div>
          </div>
          
          {/* Create button for admins */}
          {isAdmin && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="gap-1.5"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          )}
        </div>

        {news.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="text-lg font-medium mb-1">Новостей пока нет</h2>
            <p className="text-sm text-muted-foreground">
              Новости появятся здесь, когда они будут опубликованы
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => {
              const userReaction = userReactions.get(item.id);
              const youtubeId = extractYouTubeId(item.content);
              const images = (item.image_urls && item.image_urls.length > 0) 
                ? item.image_urls 
                : (item.image_url ? [item.image_url] : []);
              const isEditing = editingId === item.id;
              
              return (
                <article 
                  key={item.id} 
                  className="glass rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 hover:-translate-y-0.5"
                >
                  {images.length > 0 && (
                    <ImageGallery 
                      images={images} 
                      title={item.title} 
                      onImageClick={(index) => openLightbox(images, index)}
                    />
                  )}
                  
                  <div className="p-4">
                    {/* Author & Time + Admin Actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-accent/20">
                          <img src={hardyLogo} alt="HARDY" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-medium text-accent">HARDY NEWS</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru })}
                        </span>
                      </div>
                      
                      {/* Admin actions */}
                      {isAdmin && !isEditing && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-accent"
                            onClick={() => startEditing(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNews(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Заголовок (опционально)"
                          className="text-sm"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Содержание новости"
                          rows={4}
                          className="text-sm resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(item.id)}
                            disabled={saving || !editContent.trim()}
                            className="gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Сохранить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={saving}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        {item.title && (
                          <h2 className="text-base font-semibold text-foreground mb-2 leading-snug">
                            {item.title}
                          </h2>
                        )}
                        
                        <div className="text-sm text-foreground/80 leading-relaxed mb-3">
                          {formatContent(item.content)}
                        </div>
                        
                        {youtubeId && <YouTubeEmbed videoId={youtubeId} />}
                      </>
                    )}
                    
                    {/* Reactions - Minimal */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-3 gap-1.5 rounded-full text-xs transition-all ${
                            userReaction === 'like' 
                              ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' 
                              : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          onClick={() => handleReaction(item.id, 'like')}
                          disabled={reacting === item.id}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{item.likes_count}</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-3 gap-1.5 rounded-full text-xs transition-all ${
                            userReaction === 'dislike' 
                              ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25' 
                              : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                          }`}
                          onClick={() => handleReaction(item.id, 'dislike')}
                          disabled={reacting === item.id}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>{item.dislikes_count}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
