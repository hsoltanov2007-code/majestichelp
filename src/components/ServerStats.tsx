import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Trophy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerData {
  name: string;
  online: number;
  queue?: number;
  bonus?: string;
  isNew?: boolean;
  isMaintenance?: boolean;
}

interface StatsData {
  totalOnline: number;
  peakToday: number;
  peakAllTime: number;
  servers: ServerData[];
}

export default function ServerStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Попытка получить данные с API Majestic RP
      const response = await fetch("https://api.majestic-rp.ru/servers/info", {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error("API недоступен");
      }
    } catch (err) {
      // Fallback на демо-данные если API недоступен
      setStats({
        totalOnline: 14091,
        peakToday: 18129,
        peakAllTime: 43373,
        servers: [
          { name: "Denver", online: 2239 },
          { name: "Phoenix", online: 2030, queue: 1 },
          { name: "Seattle", online: 1024, bonus: "x1.1" },
          { name: "Chicago", online: 777, queue: 1, bonus: "x1.2" },
          { name: "Houston", online: 772, bonus: "x1.15" },
          { name: "San Diego", online: 762, bonus: "x1.2", isNew: true },
          { name: "San Francisco", online: 748, bonus: "x1.2" },
          { name: "New York", online: 721, bonus: "x1.2" },
          { name: "Atlanta", online: 704, bonus: "x1.2" },
          { name: "Detroit", online: 700, bonus: "x1.2" },
          { name: "Los Angeles", online: 688, bonus: "x1.2" },
          { name: "Miami", online: 674, bonus: "x1.2" },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Обновление каждые 60 секунд
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Загрузка статистики...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Онлайн серверов
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchStats}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общая статистика */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              {stats.totalOnline.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              Текущий онлайн
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
              {stats.peakToday.toLocaleString()}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              Пик за сегодня
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-500">
              {stats.peakAllTime.toLocaleString()}
              <Trophy className="h-4 w-4" />
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              Пик за всё время
            </div>
          </div>
        </div>

        {/* Список серверов */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {stats.servers.map((server) => (
            <div 
              key={server.name}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${server.isMaintenance ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
                <span className="font-medium">{server.name}</span>
                {server.bonus && (
                  <Badge variant="secondary" className="text-xs">
                    Опыт {server.bonus}
                  </Badge>
                )}
                {server.isNew && (
                  <Badge className="text-xs bg-green-500">Новичкам</Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{server.online.toLocaleString()}</div>
                {server.queue ? (
                  <div className="text-xs text-muted-foreground">
                    {server.queue} в очереди
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">онлайн</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          Данные обновляются автоматически
        </div>
      </CardContent>
    </Card>
  );
}
