import { Layout } from "@/components/Layout";
import { trafficArticles } from "@/data/trafficCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Banknote, Car, Bookmark, Printer, Link2, ExternalLink } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import hardyLogo from "@/assets/hardy-logo.png";
import { originalLinks } from "@/data/originalLinks";

export default function TrafficCode() {
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("article");
  const [search, setSearch] = useState("");
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

  const filtered = trafficArticles.filter((a) =>
    a.article.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleFavorite = (article: typeof trafficArticles[0]) => {
    const wasFavorite = isFavorite(article.id, "traffic");
    toggleFavorite({
      id: article.id,
      type: "traffic",
      article: article.article,
      description: article.description
    });
    toast({
      title: wasFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: article.article
    });
  };

  const handleCopyLink = (articleId: string) => {
    const url = `${window.location.origin}/traffic-code#${articleId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: url });
  };

  const handlePrint = (article: typeof trafficArticles[0]) => {
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
            </style>
          </head>
          <body>
            <h1>🚗 ${article.article}</h1>
            <div class="info"><span class="label">Штраф:</span> ${article.fine}</div>
            <h2>Описание</h2>
            <p>${article.description}</p>
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
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-3xl font-bold">Дорожный кодекс</h1>
              <p className="text-muted-foreground">Всего статей: {trafficArticles.length}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(originalLinks.trafficCode, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Оригинал
          </Button>
        </div>

        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-8 max-w-md" />

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <Card
              key={article.id}
              id={article.id}
              ref={(el) => { articleRefs.current[article.id] = el; }}
              className="transition-all duration-300"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{article.article}</CardTitle>
                  </div>
                  <div className="flex gap-1">
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
                      className={isFavorite(article.id, "traffic") ? "text-accent" : "text-muted-foreground"}
                      title="В избранное"
                    >
                      <Bookmark className={`h-4 w-4 ${isFavorite(article.id, "traffic") ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">{article.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4" />
                  <span className="font-semibold text-accent">{article.fine}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
