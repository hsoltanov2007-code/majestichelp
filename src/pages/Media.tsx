import { useState, useEffect } from "react";
import { Play, Heart, Eye, ExternalLink, Plus, Trash2, Loader2, Edit, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface MediaVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  author_id: string;
  views_count: number;
  clicks_count: number;
  created_at: string;
}

interface VideoWithLikes extends MediaVideo {
  likes_count: number;
  is_liked: boolean;
}

function getVideoThumbnail(url: string): string | null {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  }
  return null;
}

function getEmbedUrl(url: string): string | null {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  return null;
}

export default function Media() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithLikes | null>(null);
  const [newVideo, setNewVideo] = useState({ title: "", description: "", video_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoWithLikes | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", video_url: "" });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
  if (!localStorage.getItem("session_id")) {
    localStorage.setItem("session_id", sessionId);
  }

  useEffect(() => {
    fetchVideos();

    const channel = supabase
      .channel('media-videos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'media_videos'
        },
        (payload) => {
          console.log('New video added:', payload);
          const newVideo = payload.new as MediaVideo;
          
          sonnerToast(
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Новое видео: {newVideo.title}</span>
            </div>,
            {
              action: {
                label: "Смотреть",
                onClick: () => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }
            }
          );
          
          fetchVideos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'media_videos'
        },
        () => {
          fetchVideos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'media_videos'
        },
        () => {
          fetchVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data: videosData, error } = await supabase
        .from("media_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const videosWithLikes = await Promise.all(
        (videosData || []).map(async (video) => {
          const { count: likesCount } = await supabase
            .from("media_video_likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", video.id);

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("media_video_likes")
              .select("id")
              .eq("video_id", video.id)
              .eq("user_id", user.id)
              .single();
            isLiked = !!likeData;
          }

          return {
            ...video,
            likes_count: likesCount || 0,
            is_liked: isLiked,
          };
        })
      );

      setVideos(videosWithLikes);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.video_url) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const thumbnail = getVideoThumbnail(newVideo.video_url);
      
      const { error } = await supabase.from("media_videos").insert({
        title: newVideo.title,
        description: newVideo.description || null,
        video_url: newVideo.video_url,
        thumbnail_url: thumbnail,
        author_id: user!.id,
      });

      if (error) throw error;

      toast({ title: "Видео добавлено!" });
      setNewVideo({ title: "", description: "", video_url: "" });
      setIsDialogOpen(false);
      fetchVideos();
    } catch (error: any) {
      toast({ title: "Ошибка при добавлении", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase.from("media_videos").delete().eq("id", videoId);
      if (error) throw error;
      toast({ title: "Видео удалено" });
      fetchVideos();
    } catch (error: any) {
      toast({ title: "Ошибка при удалении", description: error.message, variant: "destructive" });
    }
  };

  const handleEditVideo = (video: VideoWithLikes) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo || !editForm.title || !editForm.video_url) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const thumbnail = getVideoThumbnail(editForm.video_url);
      
      const { error } = await supabase
        .from("media_videos")
        .update({
          title: editForm.title,
          description: editForm.description || null,
          video_url: editForm.video_url,
          thumbnail_url: thumbnail,
        })
        .eq("id", editingVideo.id);

      if (error) throw error;

      toast({ title: "Видео обновлено!" });
      setIsEditDialogOpen(false);
      setEditingVideo(null);
      fetchVideos();
    } catch (error: any) {
      toast({ title: "Ошибка при обновлении", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (video: VideoWithLikes) => {
    if (!user) {
      toast({ title: "Войдите, чтобы ставить лайки", variant: "destructive" });
      return;
    }

    try {
      if (video.is_liked) {
        await supabase
          .from("media_video_likes")
          .delete()
          .eq("video_id", video.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("media_video_likes")
          .insert({ video_id: video.id, user_id: user.id });
      }
      fetchVideos();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleVideoClick = async (video: VideoWithLikes) => {
    setSelectedVideo(video);
    
    try {
      await supabase.rpc("increment_video_click", {
        p_video_id: video.id,
        p_session_id: sessionId,
      });
    } catch (error) {
      console.error("Error recording click:", error);
    }
  };

  const handleExternalClick = async (video: VideoWithLikes) => {
    try {
      await supabase.rpc("increment_video_click", {
        p_video_id: video.id,
        p_session_id: sessionId,
      });
    } catch (error) {
      console.error("Error recording click:", error);
    }
    window.open(video.video_url, "_blank");
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 opacity-0 animate-fade-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <Play className="h-6 w-6 text-accent" />
              </div>
              <h1 className="text-4xl font-bold">Медиатека</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Видео-контент от нашей команды
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4" />
                  Добавить видео
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Добавить новое видео</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      placeholder="Введите название видео"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Ссылка на видео *</Label>
                    <Input
                      id="url"
                      value={newVideo.video_url}
                      onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      placeholder="Краткое описание видео..."
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                  <Button onClick={handleAddVideo} disabled={submitting} className="w-full bg-accent hover:bg-accent/90">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-muted-foreground">Загрузка видео...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Play className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl text-muted-foreground">Пока нет видео</p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Нажмите "Добавить видео", чтобы начать
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => {
              const thumbnail = video.thumbnail_url || getVideoThumbnail(video.video_url);

              return (
                <Card 
                  key={video.id} 
                  className={`glass border-0 overflow-hidden group hover-lift opacity-0 animate-fade-up`}
                  style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s` }}
                >
                  <div 
                    className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                    onClick={() => handleVideoClick(video)}
                  >
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Play className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform shadow-xl">
                        <Play className="h-7 w-7 text-accent-foreground ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-accent transition-colors">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button
                          onClick={() => handleLike(video)}
                          className={`flex items-center gap-1.5 transition-all hover:scale-110 ${
                            video.is_liked ? "text-accent" : "hover:text-accent"
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${video.is_liked ? "fill-current" : ""}`} />
                          {video.likes_count}
                        </button>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {video.clicks_count}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExternalClick(video)}
                          title="Открыть оригинал"
                          className="h-8 w-8 hover:bg-primary/10"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditVideo(video)}
                              title="Редактировать"
                              className="h-8 w-8 hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ru })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Video Player Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden glass-strong">
            {selectedVideo && (
              <>
                <div className="aspect-video">
                  {getEmbedUrl(selectedVideo.video_url) ? (
                    <iframe
                      src={getEmbedUrl(selectedVideo.video_url)!}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Предпросмотр недоступен</p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                  {selectedVideo.description && (
                    <p className="text-muted-foreground">{selectedVideo.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className={`h-4 w-4 ${selectedVideo.is_liked ? "fill-accent text-accent" : ""}`} />
                      {selectedVideo.likes_count} лайков
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {selectedVideo.clicks_count} просмотров
                    </span>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Video Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Редактировать видео</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Название *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Введите название видео"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">Ссылка на видео *</Label>
                <Input
                  id="edit-url"
                  value={editForm.video_url}
                  onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Краткое описание видео..."
                  rows={3}
                  className="bg-background/50"
                />
              </div>
              <Button onClick={handleSaveEdit} disabled={submitting} className="w-full bg-accent hover:bg-accent/90">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
