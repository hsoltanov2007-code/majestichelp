import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewHistory } from "@/hooks/useViewHistory";
import { Clock, Trash2, Scale, FileText, Car, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export default function History() {
  const { history, clearHistory, removeFromHistory } = useViewHistory();

  const getIcon = (type: string) => {
    switch (type) {
      case "criminal":
        return <Scale className="h-4 w-4 text-destructive" />;
      case "administrative":
        return <FileText className="h-4 w-4 text-primary" />;
      case "traffic":
        return <Car className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getPath = (type: string, id: string) => {
    switch (type) {
      case "criminal":
        return `/criminal-code?article=${id}`;
      case "administrative":
        return `/administrative-code?article=${id}`;
      case "traffic":
        return `/traffic-code?article=${id}`;
      default:
        return "/";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "criminal":
        return "УК";
      case "administrative":
        return "АК";
      case "traffic":
        return "ДК";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">История просмотров</h1>
              <p className="text-muted-foreground">
                Последние просмотренные статьи
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Очистить
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>История просмотров пуста</p>
              <p className="text-sm mt-1">
                Просмотренные статьи будут появляться здесь
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <Card key={`${item.type}-${item.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.article}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {getTypeName(item.type)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(item.viewedAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={getPath(item.type, item.id)}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromHistory(item.id, item.type)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
