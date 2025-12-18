import { Layout } from "@/components/Layout";
import { adminArticles } from "@/data/administrativeCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Banknote } from "lucide-react";

export default function AdministrativeCode() {
  const [search, setSearch] = useState("");

  const filtered = adminArticles.filter((a) =>
    a.article.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

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
            <Card key={article.id} className="border-l-4 border-l-severity-low">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📜 {article.article}</CardTitle>
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
