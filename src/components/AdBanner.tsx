import { useState, useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
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

  // Rotate banners every 8 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Re-show after 30 seconds when dismissed
  useEffect(() => {
    if (!dismissed) return;
    const timeout = setTimeout(() => setDismissed(false), 30000);
    return () => clearTimeout(timeout);
  }, [dismissed]);

  if (dismissed || banners.length === 0) return null;

  const banner = banners[currentIndex];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-56 hidden lg:block animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-accent/10 border border-border/30 bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-2xl">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/90 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
          aria-label="Закрыть"
        >
          <X className="h-3 w-3" />
        </button>

        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {banner.image_url && (
            <div className="relative overflow-hidden">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-32 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
            </div>
          )}

          <div className="relative p-4 space-y-2">
            <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors duration-300 leading-snug line-clamp-2">
              {banner.title}
            </h4>
            {banner.description && (
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {banner.description}
              </p>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:gap-2 transition-all duration-300">
              {banner.link_text || "Подробнее"}
              <ExternalLink className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </a>

        {/* Banner dots */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-4 h-1.5 bg-accent"
                    : "w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-center pb-2">
          <span className="text-[8px] text-muted-foreground/30 uppercase tracking-[0.2em] font-medium">
            реклама
          </span>
        </div>
      </div>
    </div>
  );
}
