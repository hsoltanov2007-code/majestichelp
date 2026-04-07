import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Scale, FileText, Car, Users, BookOpen, HelpCircle, Play, Sparkles, ArrowRight, MessageSquare, Smartphone, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { VisitorCounter } from "@/components/VisitorCounter";
import { InstallAppButton } from "@/components/InstallAppButton";
import { FeaturedGiveawayBanner } from "@/components/FeaturedGiveawayBanner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/hooks/useViewMode";
import AppView from "./AppView";

const sections = [
  { icon: ClipboardList, title: "Шпаргалка", description: "Быстрый справочник по всем кодексам", path: "/cheat-sheet", accent: true },
  { icon: Scale, title: "Памятка новичка", description: "Гайд для новых госслужащих", path: "/beginner-guide", accent: true },
  { icon: Scale, title: "Уголовный кодекс", description: "Все статьи УК с розыском и штрафами", path: "/criminal-code" },
  { icon: FileText, title: "Административный кодекс", description: "Административные правонарушения", path: "/administrative-code" },
  { icon: Car, title: "Дорожный кодекс", description: "Правила дорожного движения", path: "/traffic-code" },
  { icon: Users, title: "Процедуры", description: "Инструкции для госслужащих", path: "/procedures" },
  { icon: BookOpen, title: "Юридическая справка", description: "Теория уголовного права", path: "/legal-reference" },
  { icon: HelpCircle, title: "FAQ", description: "Частые вопросы и ответы", path: "/faq" },
  { icon: MessageSquare, title: "Глоссарий", description: "Словарь юридических терминов", path: "/glossary" },
  { icon: HelpCircle, title: "Инструкции", description: "Как пользоваться порталом", path: "/instructions" },
];

interface LatestVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export default function Index() {
  const [latestVideo, setLatestVideo] = useState<LatestVideo | null>(null);
  const { effectiveMode, setViewMode } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestVideo = async () => {
      const { data } = await supabase
        .from('media_videos')
        .select('id, title, video_url, thumbnail_url, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setLatestVideo(data);
    };
    fetchLatestVideo();
  }, []);

  if (effectiveMode === "app") return <AppView />;

  const getVideoThumbnail = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null;
  };

  const isNewVideo = (createdAt: string) => {
    return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60) < 24;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="opacity-0 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/50 text-xs font-medium text-muted-foreground mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Majestic RP · Denver
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
                Портал{" "}
                <span className="gradient-text-accent">HARDY</span>
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground opacity-0 animate-fade-up stagger-1 max-w-xl mx-auto leading-relaxed">
              Законы, правила и процедуры — всё в одном месте
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 opacity-0 animate-fade-up stagger-2 pt-2">
              <VisitorCounter />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Giveaway */}
      <section className="container pb-4 opacity-0 animate-fade-up stagger-3">
        <FeaturedGiveawayBanner />
      </section>

      {/* Latest Video */}
      {latestVideo && (
        <section className="container py-6 opacity-0 animate-fade-up stagger-3">
          <Link to="/media" className="group block">
            <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-5 transition-all duration-500 hover:border-border/60 hover:bg-card/60">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative w-full sm:w-52 h-32 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {(latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url)) ? (
                    <img 
                      src={latestVideo.thumbnail_url || getVideoThumbnail(latestVideo.video_url) || ''} 
                      alt={latestVideo.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <Play className="h-5 w-5 text-accent-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isNewVideo(latestVideo.created_at) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent/10 text-accent rounded-md border border-accent/20">
                        <Sparkles className="h-2.5 w-2.5" />
                        Новое
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">Последнее видео</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors duration-300 line-clamp-2">
                    {latestVideo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(latestVideo.created_at).toLocaleDateString('ru-RU', { 
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-accent font-medium">
                    Смотреть
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Sections Grid */}
      <section className="container py-12 pb-24">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <Link 
              key={section.path} 
              to={section.path} 
              className={`opacity-0 animate-fade-up stagger-${Math.min(index + 1, 7)}`}
            >
              <div className={`group relative rounded-2xl border transition-all duration-500 p-5 h-full ${
                section.accent 
                  ? "border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/8" 
                  : "border-border/30 bg-card/30 hover:border-border/60 hover:bg-card/60"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                    section.accent 
                      ? "bg-accent/10 text-accent" 
                      : "bg-secondary text-muted-foreground group-hover:text-accent group-hover:bg-accent/10"
                  }`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors duration-300 flex items-center gap-2">
                      {section.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent" />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{section.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
