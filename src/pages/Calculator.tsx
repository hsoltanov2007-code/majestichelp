import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator as CalcIcon, Trash2, Star, Gavel, DollarSign } from "lucide-react";
import { criminalArticles, CriminalArticle } from "@/data/criminalCode";

interface SelectedArticle extends CriminalArticle {
  quantity: number;
}

export default function Calculator() {
  const [selectedArticles, setSelectedArticles] = useState<SelectedArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = criminalArticles.filter(
    (a) =>
      a.article.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleArticle = (article: CriminalArticle) => {
    setSelectedArticles((prev) => {
      const exists = prev.find((a) => a.id === article.id);
      if (exists) {
        return prev.filter((a) => a.id !== article.id);
      }
      return [...prev, { ...article, quantity: 1 }];
    });
  };

  const isSelected = (id: string) => selectedArticles.some((a) => a.id === id);

  const clearAll = () => setSelectedArticles([]);

  // Calculate totals
  const maxStars = selectedArticles.length > 0
    ? Math.max(...selectedArticles.map((a) => a.stars))
    : 0;

  const requiresCourt = selectedArticles.some((a) => a.court);

  const parseFine = (fineStr: string): { min: number; max: number } => {
    if (fineStr === "Не предусмотрен") return { min: 0, max: 0 };
    const numbers = fineStr.match(/\$?([\d,]+)/g);
    if (!numbers) return { min: 0, max: 0 };
    const values = numbers.map((n) => parseInt(n.replace(/[$,]/g, "")));
    if (values.length === 1) return { min: values[0], max: values[0] };
    return { min: values[0], max: values[1] };
  };

  const totalFine = selectedArticles.reduce(
    (acc, article) => {
      const { min, max } = parseFine(article.fine);
      return { min: acc.min + min, max: acc.max + max };
    },
    { min: 0, max: 0 }
  );

  const parseBail = (bailStr: string): number => {
    if (bailStr === "Не предусмотрен") return 0;
    const match = bailStr.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, "")) : 0;
  };

  const totalBail = selectedArticles.reduce((acc, article) => {
    return acc + parseBail(article.bail);
  }, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CalcIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Калькулятор наказаний</h1>
            <p className="text-muted-foreground">
              Выберите статьи для расчёта общего наказания
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Article Selection */}
          <div className="lg:col-span-2 space-y-4">
            <input
              type="text"
              placeholder="Поиск статей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2"
            />

            <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => toggleArticle(article)}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected(article.id)
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <Checkbox
                    checked={isSelected(article.id)}
                    onCheckedChange={() => toggleArticle(article)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{article.article}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: article.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-yellow-500 text-yellow-500"
                          />
                        ))}
                      </div>
                      {article.court && (
                        <Badge variant="destructive" className="text-xs">
                          Суд
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Итог</span>
                  {selectedArticles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Очистить
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Статей выбрано:</span>
                  <span className="font-bold text-lg">
                    {selectedArticles.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Уровень розыска:
                  </span>
                  <span className="font-bold text-lg">
                    {maxStars > 0 ? `${maxStars}⭐` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Gavel className="h-4 w-4" />
                    Требует суда:
                  </span>
                  <Badge variant={requiresCourt ? "destructive" : "secondary"}>
                    {requiresCourt ? "Да" : "Нет"}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Штраф:
                    </span>
                  </div>
                  <p className="font-bold text-lg text-green-600">
                    {totalFine.min === 0 && totalFine.max === 0
                      ? "Не предусмотрен"
                      : totalFine.min === totalFine.max
                      ? `$${totalFine.min.toLocaleString()}`
                      : `$${totalFine.min.toLocaleString()} - $${totalFine.max.toLocaleString()}`}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Залог:</span>
                  </div>
                  <p className="font-bold text-lg">
                    {totalBail === 0
                      ? "Не предусмотрен"
                      : `$${totalBail.toLocaleString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Selected Articles List */}
            {selectedArticles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Выбранные статьи</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {selectedArticles.map((article) => (
                      <li
                        key={article.id}
                        className="flex items-center justify-between"
                      >
                        <span>{article.article}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleArticle(article)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
