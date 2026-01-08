import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Scale, FileText, Car, ChevronRight, Search, Bookmark, Star, X, Gavel, Banknote, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { criminalArticles, CriminalArticle } from "@/data/criminalCode";
import { adminArticles, AdminArticle } from "@/data/administrativeCode";
import { trafficArticles, TrafficArticle } from "@/data/trafficCode";
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import hardyLogo from "@/assets/hardy-logo.png";

// Типы для детального просмотра
type ArticleDetail = 
  | { type: "criminal"; data: CriminalArticle }
  | { type: "administrative"; data: AdminArticle }
  | { type: "traffic"; data: TrafficArticle };

// Звёзды для отображения рейтинга
const StarRating = ({ stars }: { stars: number }) => {
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
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
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

  // Получение полных данных статьи из избранного
  const getFavoriteFullData = (fav: FavoriteItem): ArticleDetail | null => {
    if (fav.type === "criminal") {
      const data = criminalArticles.find((a) => a.id === fav.id);
      return data ? { type: "criminal", data } : null;
    }
    if (fav.type === "administrative") {
      const data = adminArticles.find((a) => a.id === fav.id);
      return data ? { type: "administrative", data } : null;
    }
    if (fav.type === "traffic") {
      const data = trafficArticles.find((a) => a.id === fav.id);
      return data ? { type: "traffic", data } : null;
    }
    return null;
  };

  const handleToggleFavorite = (id: string, type: "criminal" | "administrative" | "traffic", article: string, description: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const wasFavorite = isFavorite(id, type);
    toggleFavorite({ id, type, article, description });
    toast({
      title: wasFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: article,
    });
  };

  // Формат штрафа (короткий)
  const formatFineShort = (fine: string) => {
    if (!fine || fine === "" || fine.toLowerCase().includes("не предусмотрен")) {
      return "Не предусмотрен";
    }
    const match = fine.match(/\$[\d,\.]+/);
    if (match) return match[0];
    const rangeMatch = fine.match(/от\s*([\d\.,]+)\$?\s*до\s*([\d\.,]+)/i);
    if (rangeMatch) return `$${rangeMatch[1]} - $${rangeMatch[2]}`;
    return fine.length > 30 ? fine.substring(0, 27) + "..." : fine;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "criminal": return "УК";
      case "administrative": return "АК";
      case "traffic": return "ПДД";
      default: return "";
    }
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

      {/* Search - скрыт в избранном */}
      {activeTab !== "favorites" && (
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
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 mx-4 mt-3 bg-muted/50">
          <TabsTrigger value="criminal" className="gap-1 text-xs data-[state=active]:bg-background">
            <Scale className="h-3.5 w-3.5" />
            УК
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1 text-xs data-[state=active]:bg-background">
            <FileText className="h-3.5 w-3.5" />
            АК
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-1 text-xs data-[state=active]:bg-background">
            <Car className="h-3.5 w-3.5" />
            ПДД
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-1 text-xs data-[state=active]:bg-background">
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Избранное</span>
            <span className="sm:hidden">★</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-3">
          {/* Criminal Code */}
          <TabsContent value="criminal" className="mt-0 px-4 pb-24">
            <div className="space-y-2">
              {filteredCriminal.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle({ type: "criminal", data: article })}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3 cursor-pointer active:bg-muted/50 transition-colors"
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
                      {formatFineShort(article.fine)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(article.id, "criminal", article.article, article.description, e)}
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "criminal")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isFavorite(article.id, "criminal") ? "fill-current" : ""}`} />
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
                  onClick={() => setSelectedArticle({ type: "administrative", data: article })}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3 cursor-pointer active:bg-muted/50 transition-colors"
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
                    <p className="text-xs text-muted-foreground mt-1">{formatFineShort(article.fine)}</p>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(article.id, "administrative", article.article, article.description, e)}
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "administrative")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isFavorite(article.id, "administrative") ? "fill-current" : ""}`} />
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
                  onClick={() => setSelectedArticle({ type: "traffic", data: article })}
                  className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3 cursor-pointer active:bg-muted/50 transition-colors"
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
                    onClick={(e) => handleToggleFavorite(article.id, "traffic", article.article, article.description, e)}
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${
                      isFavorite(article.id, "traffic")
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isFavorite(article.id, "traffic") ? "fill-current" : ""}`} />
                  </button>
                </div>
              ))}
              {filteredTraffic.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
              )}
            </div>
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites" className="mt-0 px-4 pb-24">
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Избранное пусто</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Нажмите на закладку, чтобы добавить статью
                  </p>
                </div>
              ) : (
                favorites.map((fav) => {
                  const fullData = getFavoriteFullData(fav);
                  return (
                    <div
                      key={`${fav.type}-${fav.id}`}
                      onClick={() => fullData && setSelectedArticle(fullData)}
                      className="p-4 rounded-lg bg-card/50 border border-border/30 flex items-start justify-between gap-3 cursor-pointer active:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {fav.article}
                          </Badge>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {getTypeLabel(fav.type)}
                          </Badge>
                          {fullData?.type === "criminal" && (
                            <StarRating stars={(fullData.data as CriminalArticle).stars} />
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {fav.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(fav.id, fav.type, fav.article, fav.description, e)}
                        className="shrink-0 p-1.5 rounded-md text-accent transition-colors"
                      >
                        <Bookmark className="h-5 w-5 fill-current" />
                      </button>
                    </div>
                  );
                })
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
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              activeTab === "criminal" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Scale className="h-5 w-5" />
            <span className="text-xs">УК</span>
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              activeTab === "admin" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">АК</span>
          </button>
          <button
            onClick={() => setActiveTab("traffic")}
            className={`flex flex-col items-center gap-1 px-3 py-2 ${
              activeTab === "traffic" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Car className="h-5 w-5" />
            <span className="text-xs">ПДД</span>
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex flex-col items-center gap-1 px-3 py-2 relative ${
              activeTab === "favorites" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Bookmark className={`h-5 w-5 ${activeTab === "favorites" ? "fill-current" : ""}`} />
            <span className="text-xs">★</span>
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
          <Link
            to="/"
            className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="text-xs">Сайт</span>
          </Link>
        </div>
      </nav>

      {/* Article Detail Sheet */}
      <Sheet open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="text-left pb-4 border-b border-border/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedArticle?.type === "criminal" && (
                    <>
                      <Badge variant="outline">Ст. {(selectedArticle.data as CriminalArticle).article}</Badge>
                      <StarRating stars={(selectedArticle.data as CriminalArticle).stars} />
                    </>
                  )}
                  {selectedArticle?.type === "administrative" && (
                    <Badge variant="outline">{(selectedArticle.data as AdminArticle).article}</Badge>
                  )}
                  {selectedArticle?.type === "traffic" && (
                    <Badge variant="outline">{(selectedArticle.data as TrafficArticle).article}</Badge>
                  )}
                </div>
                <SheetTitle className="text-lg">
                  {selectedArticle?.data.description}
                </SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedArticle(null)}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(85vh-120px)] mt-4">
            {selectedArticle?.type === "criminal" && (
              <div className="space-y-4 pr-4">
                {/* Суд */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Суд</p>
                    <p className="font-medium">
                      {(selectedArticle.data as CriminalArticle).court ? "Требуется" : "Не требуется"}
                    </p>
                  </div>
                </div>

                {/* Залог */}
                {(selectedArticle.data as CriminalArticle).bail && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Banknote className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Залог</p>
                      <p className="font-medium">{(selectedArticle.data as CriminalArticle).bail}</p>
                    </div>
                  </div>
                )}

                {/* Штраф */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Наказание</p>
                    <p className="font-medium">
                      {(selectedArticle.data as CriminalArticle).fine || "Не предусмотрен"}
                    </p>
                  </div>
                </div>

                {/* Процедура */}
                {(selectedArticle.data as CriminalArticle).procedure && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Процедура задержания</p>
                    <p className="text-sm">{(selectedArticle.data as CriminalArticle).procedure}</p>
                  </div>
                )}

                {/* Категория */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Категория</p>
                  <p className="text-sm">{(selectedArticle.data as CriminalArticle).category}</p>
                </div>

                {/* Кнопка добавления в избранное */}
                <Button
                  variant={isFavorite(selectedArticle.data.id, "criminal") ? "secondary" : "default"}
                  className="w-full mt-4"
                  onClick={() => {
                    const article = selectedArticle.data as CriminalArticle;
                    handleToggleFavorite(article.id, "criminal", article.article, article.description);
                  }}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isFavorite(selectedArticle.data.id, "criminal") ? "fill-current" : ""}`} />
                  {isFavorite(selectedArticle.data.id, "criminal") ? "Удалить из избранного" : "Добавить в избранное"}
                </Button>
              </div>
            )}

            {selectedArticle?.type === "administrative" && (
              <div className="space-y-4 pr-4">
                {/* Штраф */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Штраф</p>
                    <p className="font-medium">{(selectedArticle.data as AdminArticle).fine}</p>
                  </div>
                </div>

                {/* Кнопка добавления в избранное */}
                <Button
                  variant={isFavorite(selectedArticle.data.id, "administrative") ? "secondary" : "default"}
                  className="w-full mt-4"
                  onClick={() => {
                    const article = selectedArticle.data as AdminArticle;
                    handleToggleFavorite(article.id, "administrative", article.article, article.description);
                  }}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isFavorite(selectedArticle.data.id, "administrative") ? "fill-current" : ""}`} />
                  {isFavorite(selectedArticle.data.id, "administrative") ? "Удалить из избранного" : "Добавить в избранное"}
                </Button>
              </div>
            )}

            {selectedArticle?.type === "traffic" && (
              <div className="space-y-4 pr-4">
                {/* Штраф */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Штраф</p>
                    <p className="font-medium">{(selectedArticle.data as TrafficArticle).fine}</p>
                  </div>
                </div>

                {/* Кнопка добавления в избранное */}
                <Button
                  variant={isFavorite(selectedArticle.data.id, "traffic") ? "secondary" : "default"}
                  className="w-full mt-4"
                  onClick={() => {
                    const article = selectedArticle.data as TrafficArticle;
                    handleToggleFavorite(article.id, "traffic", article.article, article.description);
                  }}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isFavorite(selectedArticle.data.id, "traffic") ? "fill-current" : ""}`} />
                  {isFavorite(selectedArticle.data.id, "traffic") ? "Удалить из избранного" : "Добавить в избранное"}
                </Button>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
