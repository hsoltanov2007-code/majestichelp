import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Scale, FileText, Car, ChevronRight, Search, Bookmark, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { criminalArticles } from "@/data/criminalCode";
import { adminArticles } from "@/data/administrativeCode";
import { trafficArticles } from "@/data/trafficCode";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import hardyLogo from "@/assets/hardy-logo.png";

// Звёзды для отображения рейтинга
const StarRating = ({ stars, maxStars = 5 }: { stars: number; maxStars?: number }) => {
  const getColor = (stars: number) => {
    if (stars >= 5) return "bg-destructive";
    if (stars >= 4) return "bg-destructive";
    if (stars >= 3) return "bg-orange-500";
    return "bg-emerald-500";
  };

  return (
    <Badge className={`${getColor(stars)} text-white gap-0.5 px-1.5 py-0.5`}>
      {Array.from({ length: stars }).map((_, i) => (
        <span key={i} className="text-[10px]">★</span>
      ))}
    </Badge>
  );
};

export default function AppView() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("criminal");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  // Фильтрация статей
  const filteredCriminal = useMemo(() => {
    if (!search.trim()) return criminalArticles;
    const lower = search.toLowerCase();
    return criminalArticles.filter(
      (a) => a.article.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
    );
  }, [search]);

  const filteredAdmin = useMemo(() => {
    if (!search.trim()) return adminArticles;
    const lower = search.toLowerCase();
    return adminArticles.filter(
      (a) => a.article.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
    );
  }, [search]);

  const filteredTraffic = useMemo(() => {
    if (!search.trim()) return trafficArticles;
    const lower = search.toLowerCase();
    return trafficArticles.filter(
      (a) => a.article.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
    );
  }, [search]);

  const handleToggleFavorite = (id: string, type: "criminal" | "administrative" | "traffic", article: string, description: string) => {
    const wasFavorite = isFavorite(id, type);
    toggleFavorite({ id, type, article, description });
    toast({
      title: wasFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: article,
    });
  };

  // Формат штрафа
  const formatFine = (fine: string) => {
    if (!fine || fine === "" || fine.toLowerCase().includes("не предусмотрен")) {
      return "Не предусмотрен";
    }
    // Ищем сумму в формате $X,XXX или $XX,XXX
    const match = fine.match(/\$[\d,\.]+/);
    if (match) {
      return match[0];
    }
    // Ищем диапазон
    const rangeMatch = fine.match(/от\s*([\d\.,]+)\$?\s*до\s*([\d\.,]+)/i);
    if (rangeMatch) {
      return `$${rangeMatch[1]} - $${rangeMatch[2]}`;
    }
    return fine.length > 30 ? fine.substring(0, 27) + "..." : fine;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={hardyLogo} alt="HARDY" className="w-8 h-8" />
          <h1 className="text-lg font-bold">
            <span className="text-accent">HARDY</span> Кодексы
          </h1>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск статей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-3 bg-muted/50">
          <TabsTrigger value="criminal" className="gap-1.5 data-[state=active]:bg-background">
            <Scale className="h-4 w-4" />
            УК
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            АК
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-1.5 data-[state=active]:bg-background">
            <Car className="h-4 w-4" />
            ПДД
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-3">
          {/* Criminal Code */}
          <TabsContent value="criminal" className="mt-0 px-4 pb-24">
            <div className="space-y-2">
              {filteredCriminal.map((article) => (
                <div
                  key={article.id}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs shrink-0">
                        Ст. {article.article}
                      </Badge>
                      <StarRating stars={article.stars} />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFine(article.fine)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleFavorite(article.id, "criminal", article.article, article.description)
                    }
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "criminal")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isFavorite(article.id, "criminal") ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
              ))}
              {filteredCriminal.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
              )}
            </div>
          </TabsContent>

          {/* Administrative Code */}
          <TabsContent value="admin" className="mt-0 px-4 pb-24">
            <div className="space-y-2">
              {filteredAdmin.map((article) => (
                <div
                  key={article.id}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {article.article}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatFine(article.fine)}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleFavorite(article.id, "administrative", article.article, article.description)
                    }
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "administrative")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isFavorite(article.id, "administrative") ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
              ))}
              {filteredAdmin.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
              )}
            </div>
          </TabsContent>

          {/* Traffic Code */}
          <TabsContent value="traffic" className="mt-0 px-4 pb-24">
            <div className="space-y-2">
              {filteredTraffic.map((article) => (
                <div
                  key={article.id}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {article.article}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {article.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{article.fine}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggleFavorite(article.id, "traffic", article.article, article.description)
                    }
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "traffic")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${isFavorite(article.id, "traffic") ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
              ))}
              {filteredTraffic.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab("criminal")}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              activeTab === "criminal" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Scale className="h-5 w-5" />
            <span className="text-xs">УК</span>
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              activeTab === "admin" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">АК</span>
          </button>
          <button
            onClick={() => setActiveTab("traffic")}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              activeTab === "traffic" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Car className="h-5 w-5" />
            <span className="text-xs">ПДД</span>
          </button>
          <Link
            to="/"
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="text-xs">Сайт</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
