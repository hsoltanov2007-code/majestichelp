import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scale, FileText, Car, Users, BookOpen, HelpCircle, Search, Shield, Play, Sparkles, ArrowRight, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { VisitorCounter } from "@/components/VisitorCounter";
import { InstallAppButton } from "@/components/InstallAppButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const sections = [
  { icon: Scale, title: "Уголовный кодекс", description: "Все статьи УК с розыском и штрафами", path: "/criminal-code", gradient: "from-destructive/20 to-destructive/5", iconColor: "text-destructive" },
  { icon: FileText, title: "Административный кодекс", description: "Административные правонарушения", path: "/administrative-code", gradient: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-500" },
  { icon: Car, title: "Дорожный кодекс", description: "Правила дорожного движения", path: "/traffic-code", gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
  { icon: Users, title: "Процедуры", description: "Инструкции для госслужащих", path: "/procedures", gradient: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
  { icon: Shield, title: "Правила ГО", description: "Правила государственных организаций", path: "/government-rules", gradient: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500" },
  { icon: BookOpen, title: "Юридическая справка", description: "Теория уголовного права", path: "/legal-reference", gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
  { icon: HelpCircle, title: "FAQ", description: "Частые вопросы и ответы", path: "/faq", gradient: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-500" },
  { icon: MessageSquare, title: "Глоссарий", description: "Словарь юридических терминов", path: "/glossary", gradient: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-500" },
  { icon: HelpCircle, title: "Инструкции", description: "Как пользоваться порталом", path: "/instructions", gradient: "from-muted to-muted/50", iconColor: "text-muted-foreground" },
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
    return diffHours < 24;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="opacity-0 animate-fade-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Портал <span className="gradient-text-accent">HARDY</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground opacity-0 animate-fade-up stagger-1">
              Majestic RP — законы, правила и процедуры
            </p>
            
            <form onSubmit={handleSearch} className="opacity-0 animate-fade-up stagger-2">
              <div className="relative max-w-xl mx-auto group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-primary/50 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative flex gap-2 p-2 glass rounded-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по законам..."
                      className="pl-12 h-14 text-lg bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 px-6 rounded-lg bg-accent hover:bg-accent/90">
                    Найти
                  </Button>
                </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-4 opacity-0 animate-fade-up stagger-3">
              <VisitorCounter />
              <InstallAppButton />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Video Section */}
      {latestVideo && (
        <section className="container py-8 opacity-0 animate-fade-up stagger-4">
          <Card className="overflow-hidden border-0 glass hover-lift group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center gap-3">
                {isNewVideo(latestVideo.created_at) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full animate-pulse-glow">
                    <Sparkles className="h-3 w-3" />
                    Новое
                  </span>
                )}
                <CardTitle className="text-xl">Последнее видео</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Link to="/media" className="flex flex-col sm:flex-row gap-6 group/link">
                <div className="relative w-full sm:w-56 h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {(latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url)) ? (
                    <img 
                      src={latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url) || ''} 
                      alt={latestVideo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/link:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/link:opacity-100 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center transform scale-75 group-hover/link:scale-100 transition-transform">
                      <Play className="h-6 w-6 text-accent-foreground ml-1" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-semibold text-foreground group-hover/link:text-accent transition-colors line-clamp-2">
                    {latestVideo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(latestVideo.created_at).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-accent font-medium">
                    Смотреть в медиатеке
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Sections Grid */}
      <section className="container py-12 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <Link key={section.path} to={section.path} className={`opacity-0 animate-fade-up stagger-${Math.min(index + 1, 7)}`}>
              <Card className="h-full border-0 glass hover-lift card-hover-gradient group cursor-pointer">
                <CardHeader className="relative">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${section.gradient} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                    <section.icon className={`h-7 w-7 ${section.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-accent transition-colors flex items-center gap-2">
                    {section.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </CardTitle>
                  <CardDescription className="text-base">{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
