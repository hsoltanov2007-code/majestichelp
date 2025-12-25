import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scale, FileText, Car, Users, BookOpen, HelpCircle, Search, Shield, Play, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { VisitorCounter } from "@/components/VisitorCounter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const sections = [
  { icon: Scale, title: "Уголовный кодекс", description: "Все статьи УК с розыском и штрафами", path: "/criminal-code", color: "bg-destructive/10 text-destructive" },
  { icon: FileText, title: "Административный кодекс", description: "Административные правонарушения", path: "/administrative-code", color: "bg-orange-500/10 text-orange-500" },
  { icon: Car, title: "Дорожный кодекс", description: "Правила дорожного движения", path: "/traffic-code", color: "bg-primary/10 text-primary" },
  { icon: Users, title: "Процедуры", description: "Инструкции для госслужащих", path: "/procedures", color: "bg-green-500/10 text-green-500" },
  { icon: Shield, title: "Правила ГО", description: "Правила государственных организаций", path: "/government-rules", color: "bg-blue-500/10 text-blue-500" },
  { icon: BookOpen, title: "Юридическая справка", description: "Теория уголовного права", path: "/legal-reference", color: "bg-accent/10 text-accent" },
  { icon: HelpCircle, title: "Инструкции", description: "Как пользоваться порталом", path: "/instructions", color: "bg-muted text-muted-foreground" },
];

interface LatestVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export default function Index() {
  const [search, setSearch] = useState("");
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestVideo = async () => {
      const { data } = await supabase
        .from('media_videos')
        .select('id, title, video_url, thumbnail_url, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLatestVideo(data);
      }
    };

    fetchLatestVideo();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/criminal-code?search=${encodeURIComponent(search)}`);
    }
  };

  const getVideoThumbnail = (url: string) => {
    // Extract YouTube video ID
    const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  const isNewVideo = (createdAt: string) => {
    const videoDate = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24; // New if less than 24 hours old
  };

  return (
    <Layout>
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Портал <span className="text-accent">Denver</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Majestic RP — здесь собраны все законы, правила и процедуры штата Denver
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mt-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Поиск по законам..."
                  className="pl-10 h-12 text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>

            <div className="flex justify-center mt-6">
              <VisitorCounter />
            </div>
          </div>
        </div>
      </section>

      {latestVideo && (
        <section className="container py-8">
          <Card className="overflow-hidden border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {isNewVideo(latestVideo.created_at) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    Новое
                  </span>
                )}
                <CardTitle className="text-lg">Последнее видео</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Link to="/media" className="flex flex-col sm:flex-row gap-4 group">
                <div className="relative w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {(latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url)) ? (
                    <img 
                      src={latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url) || ''} 
                      alt={latestVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {latestVideo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(latestVideo.created_at).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-accent justify-start">
                    Смотреть в медиатеке →
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="container py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.path} to={section.path}>
              <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.color} mb-2`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="group-hover:text-accent transition-colors">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
