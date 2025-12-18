import { Layout } from "@/components/Layout";
import { adminArticles } from "@/data/administrativeCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Banknote, Bookmark } from "lucide-react";
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
            <Card key={article.id} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">📜 {article.article}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(article)}
                    className={isFavorite(article.id, "administrative") ? "text-accent" : "text-muted-foreground"}
                  >
                    <Bookmark className={`h-5 w-5 ${isFavorite(article.id, "administrative") ? "fill-current" : ""}`} />
                  </Button>
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
