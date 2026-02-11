import { ExternalLink } from "lucide-react";

interface AdBannerProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
}

const defaultAd: AdBannerProps = {
  title: "🎮 Majestic RP — Лучший сервер GTA 5 RP",
  description: "Присоединяйся к тысячам игроков! Уникальные фракции, реалистичная экономика и дружное комьюнити.",
  linkUrl: "https://majestic-rp.ru",
  linkText: "Начать играть",
};

export function AdBanner({
  imageUrl,
  title = defaultAd.title,
  description = defaultAd.description,
  linkUrl = defaultAd.linkUrl,
  linkText = defaultAd.linkText,
}: AdBannerProps) {
  return (
    <div className="container py-4">
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl border border-border/50 glass hover-lift transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {imageUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
              <img
                src={imageUrl}
                alt={title || "Реклама"}
                className="w-full sm:w-48 h-24 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                {title && <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">{title}</h3>}
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
              {linkText && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg flex-shrink-0">
                  {linkText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex-1 text-center sm:text-left">
                {title && <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">{title}</h3>}
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
              {linkText && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg flex-shrink-0 whitespace-nowrap">
                  {linkText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          )}
          
          <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            реклама
          </div>
        </div>
      </a>
    </div>
  );
}
