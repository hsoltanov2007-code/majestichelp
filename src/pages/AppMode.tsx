import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Scale, FileText, Car, Gavel, BookOpen, X, ChevronRight, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { criminalArticles } from "@/data/criminalCode";
import { adminArticles } from "@/data/administrativeCode";
import { trafficArticles } from "@/data/trafficCode";
import { useFavorites } from "@/hooks/useFavorites";

type CodeType = "criminal" | "admin" | "traffic";

export default function AppMode() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CodeType>("criminal");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const getFilteredArticles = () => {
    const query = search.toLowerCase();
    
    switch (activeTab) {
      case "criminal":
        return criminalArticles.filter(
          (a) =>
            a.article.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query)
        );
      case "admin":
        return adminArticles.filter(
          (a) =>
            a.article.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query)
        );
      case "traffic":
        return trafficArticles.filter(
          (a) =>
            a.article.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  };

  const filteredArticles = getFilteredArticles();

  const getSeverityColor = (stars: number) => {
    if (stars <= 2) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (stars <= 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getTypeForFavorite = (tab: CodeType): "criminal" | "administrative" | "traffic" => {
    if (tab === "admin") return "administrative";
    return tab;
  };

  const renderArticleCard = (article: any) => {
    const favType = getTypeForFavorite(activeTab);
    const isFav = isFavorite(article.id, favType);

    return (
      <Card
        key={article.id}
        className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
        onClick={() => setSelectedArticle({ ...article, type: activeTab })}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono shrink-0">
                {article.article}
              </Badge>
              {activeTab === "criminal" && article.stars && (
                <Badge className={`text-xs ${getSeverityColor(article.stars)}`}>
                  {"★".repeat(article.stars)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground/90 line-clamp-2">
              {article.description}
            </p>
            {article.fine && (
              <p className="text-xs text-muted-foreground mt-1">
                {article.fine}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite({
                id: article.id,
                type: favType,
                article: article.article,
                description: article.description
              });
            }}
          >
            {isFav ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    );
  };

  const renderArticleDetail = () => {
    if (!selectedArticle) return null;

    const favType = getTypeForFavorite(selectedArticle.type);
    const isFav = isFavorite(selectedArticle.id, favType);

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {selectedArticle.article}
            </Badge>
            {selectedArticle.stars && (
              <Badge className={getSeverityColor(selectedArticle.stars)}>
                {"★".repeat(selectedArticle.stars)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite({
                id: selectedArticle.id,
                type: favType,
                article: selectedArticle.article,
                description: selectedArticle.description
              })}
            >
              {isFav ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedArticle(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <h1 className="text-xl font-bold mb-4">{selectedArticle.description}</h1>

          {selectedArticle.fine && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Наказание</p>
              <p className="text-foreground">{selectedArticle.fine}</p>
            </div>
          )}

          {selectedArticle.bail && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Залог</p>
              <p className="text-foreground">{selectedArticle.bail}</p>
            </div>
          )}

          {selectedArticle.court && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400">Требуется судебное разбирательство</p>
            </div>
          )}

          {selectedArticle.procedure && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Процедура задержания</p>
              <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-line">
                {selectedArticle.procedure}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/images/hardy-logo.png"
            alt="HARDY"
            className="h-8 w-8"
          />
          <h1 className="text-lg font-bold">HARDY Кодексы</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск статей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CodeType)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="criminal" className="text-xs">
            <Scale className="h-3 w-3 mr-1" />
            УК
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            АК
          </TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs">
            <Car className="h-3 w-3 mr-1" />
            ПДД
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-2 pb-20">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ничего не найдено</p>
              </div>
            ) : (
              filteredArticles.map(renderArticleCard)
            )}
          </div>
        </ScrollArea>
      </Tabs>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-2 safe-area-pb">
        <div className="flex justify-around">
          <Button
            variant={activeTab === "criminal" ? "default" : "ghost"}
            size="sm"
            className="flex-col h-auto py-2 px-4"
            onClick={() => setActiveTab("criminal")}
          >
            <Scale className="h-5 w-5 mb-1" />
            <span className="text-xs">УК</span>
          </Button>
          <Button
            variant={activeTab === "admin" ? "default" : "ghost"}
            size="sm"
            className="flex-col h-auto py-2 px-4"
            onClick={() => setActiveTab("admin")}
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-xs">АК</span>
          </Button>
          <Button
            variant={activeTab === "traffic" ? "default" : "ghost"}
            size="sm"
            className="flex-col h-auto py-2 px-4"
            onClick={() => setActiveTab("traffic")}
          >
            <Car className="h-5 w-5 mb-1" />
            <span className="text-xs">ПДД</span>
          </Button>
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 px-4"
            >
              <ChevronRight className="h-5 w-5 mb-1" />
              <span className="text-xs">Сайт</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Article detail modal */}
      {selectedArticle && renderArticleDetail()}
    </div>
  );
}
