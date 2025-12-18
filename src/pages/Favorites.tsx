import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { Bookmark, Trash2, Scale, FileText, Car } from "lucide-react";
import { Link } from "react-router-dom";

const typeLabels = {
  criminal: { label: "УК", icon: Scale, path: "/criminal-code" },
  administrative: { label: "АК", icon: FileText, path: "/administrative-code" },
  traffic: { label: "ДК", icon: Car, path: "/traffic-code" }
};

export default function Favorites() {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Bookmark className="h-8 w-8" /> Избранное
          </h1>
          <p className="text-muted-foreground">Сохранённых статей: {favorites.length}</p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">Нет сохранённых статей</p>
              <p className="text-sm text-muted-foreground mt-2">
                Нажмите на иконку закладки рядом со статьёй, чтобы добавить её в избранное
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((item) => {
              const typeInfo = typeLabels[item.type];
              return (
                <Card key={`${item.type}-${item.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                          <typeInfo.icon className="h-4 w-4" />
                          {typeInfo.label}
                        </div>
                        <CardTitle className="text-lg">{item.article}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFavorite(item.id, item.type)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{item.description}</p>
                    <Link to={typeInfo.path} className="text-sm text-accent hover:underline">
                      Перейти в {typeInfo.label} →
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
