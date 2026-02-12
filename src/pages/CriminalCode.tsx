import { Layout } from "@/components/Layout";
import { criminalArticles, categories } from "@/data/criminalCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Star, Gavel, Banknote, AlertTriangle, Bookmark, Printer, Link2, Scale, Search, Filter } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import hardyLogo from "@/assets/hardy-logo.png";

export default function CriminalCode() {
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("article");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState("Все");
  const [starsFilter, setStarsFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (articleId && articleRefs.current[articleId]) {
      setTimeout(() => {
        articleRefs.current[articleId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        articleRefs.current[articleId]?.classList.add("ring-2", "ring-accent");
        setTimeout(() => {
          articleRefs.current[articleId]?.classList.remove("ring-2", "ring-accent");
        }, 2000);
      }, 100);
    }
  }, [articleId]);

  const filtered = criminalArticles.filter((article) => {
    const matchesSearch = article.article.toLowerCase().includes(search.toLowerCase()) ||
      article.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "Все" || article.category === categoryFilter;
    const matchesStars = starsFilter === "all" || article.stars === parseInt(starsFilter);
    const matchesCourt = courtFilter === "all" || 
      (courtFilter === "yes" && article.court) || 
      (courtFilter === "no" && !article.court);
    return matchesSearch && matchesCategory && matchesStars && matchesCourt;
  });

  const getSeverityColor = (stars: number) => {
    if (stars >= 5) return "from-destructive/30 to-destructive/10";
    if (stars >= 3) return "from-orange-500/30 to-orange-500/10";
    return "from-emerald-500/30 to-emerald-500/10";
  };

  const getSeverityBorder = (stars: number) => {
    if (stars >= 5) return "border-l-destructive";
    if (stars >= 3) return "border-l-orange-500";
    return "border-l-emerald-500";
  };

  const handleToggleFavorite = (article: typeof criminalArticles[0]) => {
    const wasFavorite = isFavorite(article.id, "criminal");
    toggleFavorite({
      id: article.id,
      type: "criminal",
      article: article.article,
      description: article.description
    });
    toast({
      title: wasFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: article.article
    });
  };

  const handleCopyLink = (articleId: string) => {
    const url = `${window.location.origin}/criminal-code#${articleId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: url });
  };

  const handlePrint = (article: typeof criminalArticles[0]) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${article.article}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #0A2342; }
              .info { margin: 10px 0; }
              .label { font-weight: bold; }
              ol { margin-top: 10px; }
            </style>
          </head>
          <body>
            <h1>📌 ${article.article}</h1>
            <div class="info"><span class="label">Уровень розыска:</span> ${"⭐".repeat(article.stars)}</div>
            <div class="info"><span class="label">Суд:</span> ${article.court ? "Требуется" : "Не требуется"}</div>
            <div class="info"><span class="label">Залог:</span> ${article.bail}</div>
            <div class="info"><span class="label">Штраф:</span> ${article.fine}</div>
            <h2>Расшифровка</h2>
            <p>${article.description}</p>
            ${article.procedure ? `
              <h2>Процедура задержания</h2>
              <p>${article.procedure}</p>
            ` : ""}
            <hr/>
            <p style="color: #666; font-size: 12px;">Denver | Majestic RP</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-10 opacity-0 animate-fade-up">
          <div className="flex items-center gap-3 mb-2">
            <img src={hardyLogo} alt="HARDY" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-4xl font-bold">Уголовный кодекс</h1>
              <p className="text-muted-foreground">Majestic RP | <span className="text-accent font-semibold">Denver</span> · Всего статей: {criminalArticles.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-8 opacity-0 animate-fade-up stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Фильтры</span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={starsFilter} onValueChange={setStarsFilter}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue placeholder="Розыск" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="all">Все звёзды</SelectItem>
                {[1,2,3,4,5].map((s) => <SelectItem key={s} value={s.toString()}>{"⭐".repeat(s)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={courtFilter} onValueChange={setCourtFilter}>
              <SelectTrigger className="bg-background/50 border-border/50">
                <SelectValue placeholder="Суд" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="yes">Требуется суд</SelectItem>
                <SelectItem value="no">Не требуется</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {filtered.map((article, index) => (
            <Card
              key={article.id}
              id={article.id}
              ref={(el) => { articleRefs.current[article.id] = el; }}
              className={`glass border-0 border-l-4 ${getSeverityBorder(article.stars)} hover-lift overflow-hidden transition-all duration-300 opacity-0 animate-slide-up`}
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getSeverityColor(article.stars)} opacity-50 pointer-events-none`} />
              
              <CardHeader className="pb-2 relative">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">📌</span>
                    {article.article}
                  </CardTitle>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleCopyLink(article.id)} 
                      title="Копировать ссылку"
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handlePrint(article)} 
                      title="Печать"
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(article)}
                      className={`h-8 w-8 ${isFavorite(article.id, "criminal") ? "text-accent hover:bg-accent/10" : "text-muted-foreground hover:bg-muted"}`}
                      title="В избранное"
                    >
                      <Bookmark className={`h-4 w-4 ${isFavorite(article.id, "criminal") ? "fill-current" : ""}`} />
                    </Button>
                    <Badge variant="outline" className="gap-1 bg-background/50">
                      <Star className="h-3 w-3" /> Розыск: {"⭐".repeat(article.stars || 1)}
                    </Badge>
                    <Badge variant={article.court ? "destructive" : "secondary"} className={article.court ? "" : "bg-background/50"}>
                      <Gavel className="h-3 w-3 mr-1" /> {article.court ? "Суд" : "Без суда"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="mb-4 text-foreground/90">{article.description}</p>
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                    <Banknote className="h-4 w-4 text-emerald-500" />
                    <span>Залог: <strong>{article.bail}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>Штраф: <strong>{article.fine}</strong></span>
                  </div>
                </div>
                {article.procedure && (
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="procedure" className="border-border/50">
                      <AccordionTrigger className="hover:text-accent">Процедура задержания</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{article.procedure}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
