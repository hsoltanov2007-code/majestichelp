import { Layout } from "@/components/Layout";
import { adminArticles } from "@/data/administrativeCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Banknote, Bookmark, Printer, Link2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

export default function AdministrativeCode() {
  const [search, setSearch] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  const filtered = adminArticles.filter((a) =>
    a.article.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleFavorite = (article: typeof adminArticles[0]) => {
    const wasFavorite = isFavorite(article.id, "administrative");
    toggleFavorite({
      id: article.id,
      type: "administrative",
      article: article.article,
      description: article.description
    });
    toast({
      title: wasFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      description: article.article
    });
  };

  const handleCopyLink = (articleId: string) => {
    const url = `${window.location.origin}/administrative-code#${articleId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: url });
  };

  const handlePrint = (article: typeof adminArticles[0]) => {
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
            <h1>📜 ${article.article}</h1>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Административный кодекс</h1>
          <p className="text-muted-foreground">Всего статей: {adminArticles.length}</p>
        </div>

        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-8 max-w-md" />

        <div className="space-y-4">
          {filtered.map((article) => (
            <Card key={article.id} id={article.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">📜 {article.article}</CardTitle>
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
                      className={isFavorite(article.id, "administrative") ? "text-accent" : "text-muted-foreground"}
                      title="В избранное"
                    >
                      <Bookmark className={`h-4 w-4 ${isFavorite(article.id, "administrative") ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{article.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span>Штраф: <strong className="text-accent">{article.fine}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
