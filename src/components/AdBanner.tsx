import { useState, useEffect } from "react";
import { ExternalLink, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  link_text: string | null;
  order_index: number;
}

export function AdBanner() {
  const [banners, setBanners] = useState<AdBannerData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("ad_banners")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      if (data && data.length > 0) setBanners(data);
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (!dismissed) return;
    const timeout = setTimeout(() => setDismissed(false), 30000);
    return () => clearTimeout(timeout);
  }, [dismissed]);

  if (dismissed || banners.length === 0) return null;

  const banner = banners[currentIndex];

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 w-72 hidden lg:block animate-fade-in">
      <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_60px_-12px_hsl(var(--accent)/0.25)] border border-accent/15">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 via-transparent to-primary/10 pointer-events-none z-[1]" />
        
        {/* Background */}
        <div className="relative bg-gradient-to-b from-card/98 via-card/95 to-card backdrop-blur-3xl">
          {/* Decorative glows */}
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent/15 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-background/50 backdrop-blur-md hover:bg-background/80 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:rotate-90"
            aria-label="Закрыть"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            {banner.image_url ? (
              <div className="relative overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-44 object-cover transition-all duration-1000 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            ) : (
              <div className="h-20 bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-accent/40" />
              </div>
            )}

            <div className="relative p-5 space-y-3">
              <h4 className="text-base font-bold text-foreground group-hover:text-accent transition-colors duration-300 leading-snug line-clamp-2">
                {banner.title}
              </h4>
              {banner.description && (
                <p className="text-sm text-muted-foreground/70 line-clamp-3 leading-relaxed">
                  {banner.description}
                </p>
              )}
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-sm font-semibold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 group-hover:shadow-lg group-hover:shadow-accent/20">
                  {banner.link_text || "Подробнее"}
                  <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </a>

          {/* Banner dots */}
          {banners.length > 1 && (
            <div className="flex justify-center gap-2 pb-4">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-500 ${
                    i === currentIndex
                      ? "w-6 h-2 bg-accent shadow-sm shadow-accent/50"
                      : "w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="text-center pb-3">
            <span className="text-[9px] text-muted-foreground/25 uppercase tracking-[0.25em] font-medium">
              реклама
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
