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
import { Star, Gavel, Banknote, AlertTriangle, Bookmark, Printer, Link2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

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
        articleRefs.current[articleId]?.classList.add("ring-2", "ring-primary");
        setTimeout(() => {
          articleRefs.current[articleId]?.classList.remove("ring-2", "ring-primary");
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
    if (stars >= 5) return "border-l-destructive";
    if (stars >= 3) return "border-l-orange-500";
    return "border-l-green-500";
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
            ${article.procedure.length > 0 ? `
              <h2>Процедура задержания</h2>
              <ol>${article.procedure.map(s => `<li>${s}</li>`).join("")}</ol>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Уголовный кодекс</h1>
          <p className="text-muted-foreground">Всего статей: {criminalArticles.length}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Категория" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={starsFilter} onValueChange={setStarsFilter}>
            <SelectTrigger><SelectValue placeholder="Розыск" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все звёзды</SelectItem>
              {[1,2,3,4,5].map((s) => <SelectItem key={s} value={s.toString()}>{"⭐".repeat(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={courtFilter} onValueChange={setCourtFilter}>
            <SelectTrigger><SelectValue placeholder="Суд" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="yes">Требуется суд</SelectItem>
              <SelectItem value="no">Не требуется</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filtered.map((article) => (
            <Card
              key={article.id}
              id={article.id}
              ref={(el) => { articleRefs.current[article.id] = el; }}
              className={`border-l-4 ${getSeverityColor(article.stars)} transition-all duration-300`}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <CardTitle className="text-lg">📌 {article.article}</CardTitle>
                  <div className="flex gap-1 flex-wrap items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleCopyLink(article.id)} title="Копировать ссылку">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(article)} title="Печать">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(article)}
                      className={isFavorite(article.id, "criminal") ? "text-accent" : "text-muted-foreground"}
                      title="В избранное"
                    >
                      <Bookmark className={`h-4 w-4 ${isFavorite(article.id, "criminal") ? "fill-current" : ""}`} />
                    </Button>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3" /> {article.stars > 0 ? "⭐".repeat(article.stars) : "1-5⭐"}
                    </Badge>
                    <Badge variant={article.court ? "destructive" : "secondary"}>
                      <Gavel className="h-3 w-3 mr-1" /> {article.court ? "Суд" : "Без суда"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{article.description}</p>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span>Залог: <strong>{article.bail}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>Штраф: <strong>{article.fine}</strong></span>
                  </div>
                </div>
                {article.procedure.length > 0 && (
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="procedure">
                      <AccordionTrigger>Процедура задержания</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-decimal list-inside space-y-1">
                          {article.procedure.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
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
