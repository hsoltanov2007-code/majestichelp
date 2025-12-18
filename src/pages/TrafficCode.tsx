import { Layout } from "@/components/Layout";
import { trafficArticles } from "@/data/trafficCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Banknote, Car } from "lucide-react";

export default function TrafficCode() {
  const [search, setSearch] = useState("");

  const filtered = trafficArticles.filter((a) =>
    a.article.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Дорожный кодекс</h1>
          <p className="text-muted-foreground">Всего статей: {trafficArticles.length}</p>
        </div>

        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-8 max-w-md" />

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{article.article}</CardTitle>
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
