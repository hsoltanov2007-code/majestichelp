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

  // Rotate banners every 10 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (dismissed || banners.length === 0) return null;

  const banner = banners[currentIndex];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-52 hidden lg:block animate-fade-in">
      <div className="relative rounded-xl border border-border/50 glass shadow-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
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
          {banner.image_url && (
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          <div className="p-3 space-y-1.5">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-2">
              {banner.title}
            </h4>
            {banner.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {banner.description}
              </p>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              {banner.link_text || "Подробнее"}
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </a>

        {/* Banner counter */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-accent" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-center pb-1.5">
          <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            реклама
          </span>
        </div>
      </div>
    </div>
  );
}
