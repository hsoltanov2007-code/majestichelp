import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Gift } from "lucide-react";

interface FeaturedGiveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  image_url: string | null;
  ends_at: string | null;
}

function MiniCountdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Завершён"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}д ${h}ч ${m}м` : h > 0 ? `${h}ч ${m}м ${s}с` : `${m}м ${s}с`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return <span>{timeLeft}</span>;
}

export function FeaturedGiveawayBanner() {
  const [featured, setFeatured] = useState<FeaturedGiveaway[]>([]);

  useEffect(() => {
    supabase
      .from("giveaways")
      .select("id, title, description, prize, image_url, ends_at")
      .eq("status", "active")
      .eq("is_featured", true)
      .then(({ data }) => { if (data?.length) setFeatured(data); });
  }, []);

  if (!featured.length) return null;

  return (
    <>
      {featured.map(g => (
        <Link key={g.id} to="/giveaways" className="block">
          <div className="relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-gradient-to-r from-accent/15 via-card to-accent/10 p-5 shadow-[0_0_30px_hsl(351_80%_58%/0.15)] hover-lift cursor-pointer group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-accent animate-pulse" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {g.image_url && (
                <img src={g.image_url} alt={g.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              {!g.image_url && (
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Gift className="h-7 w-7 text-accent" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Розыгрыш!</span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{g.title}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge className="bg-accent/90 text-accent-foreground text-xs">{g.prize}</Badge>
                  {g.ends_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <MiniCountdown endsAt={g.ends_at} />
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shrink-0">
                Подробнее
              </Button>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}
