import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Gift, Clock, Users, Trophy, Upload, CheckCircle2, Loader2, ExternalLink, XCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Condition {
  text: string;
  link?: string;
}

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  conditions: Condition[];
  image_url: string | null;
  status: string;
  winner_id: string | null;
  ends_at: string | null;
  created_at: string;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  screenshot_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function Giveaways() {
  const { user } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [entries, setEntries] = useState<Record<string, GiveawayEntry[]>>({});
  const [myEntries, setMyEntries] = useState<Record<string, GiveawayEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGiveaways();
  }, [user]);

  const fetchGiveaways = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Ошибка загрузки розыгрышей");
    } else {
      setGiveaways((data as unknown as Giveaway[]) || []);

      const entryCounts: Record<string, GiveawayEntry[]> = {};
      const myE: Record<string, GiveawayEntry> = {};
      const winnerIds = (data || []).filter(g => g.winner_id).map(g => g.winner_id);

      for (const g of data || []) {
        const { data: entryData } = await supabase
          .from("giveaway_entries")
          .select("*")
          .eq("giveaway_id", g.id);
        entryCounts[g.id] = (entryData as unknown as GiveawayEntry[]) || [];

        if (user) {
          const mine = (entryData as unknown as GiveawayEntry[])?.find(e => e.user_id === user.id);
          if (mine) myE[g.id] = mine;
        }
      }

      if (winnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", winnerIds);
        const wp: Record<string, string> = {};
        profiles?.forEach(p => { wp[p.id] = p.username; });
        setWinnerProfiles(wp);
      }

      setEntries(entryCounts);
      setMyEntries(myE);
    }
    setIsLoading(false);
  };

  const handleScreenshotUpload = async (file: File) => {
    if (!user || !selectedGiveaway) return;
    setIsUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedGiveaway.id}/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("giveaway-screenshots")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("giveaway-screenshots")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("giveaway_entries")
        .insert({
          giveaway_id: selectedGiveaway.id,
          user_id: user.id,
          screenshot_url: urlData.publicUrl,
        } as any);

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("Вы уже участвуете в этом розыгрыше");
        } else {
          throw insertError;
        }
      } else {
        toast.success("Вы участвуете в розыгрыше!");
        setSelectedGiveaway(null);
        fetchGiveaways();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Ошибка загрузки скриншота");
    } finally {
      setIsUploading(false);
    }
  };

  const getTimeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Завершён";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-accent/10">
            <Gift className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Розыгрыши</h1>
            <p className="text-sm text-muted-foreground">Участвуй и выигрывай призы</p>
          </div>
        </div>

        {giveaways.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-16 text-muted-foreground">
              <Gift className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Пока нет активных розыгрышей</p>
              <p className="text-sm mt-1">Следите за обновлениями!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((g) => {
              const isActive = g.status === "active";
              const isCompleted = g.status === "completed";
              const participantCount = entries[g.id]?.length || 0;

              return (
                <Card
                  key={g.id}
                  className={`group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 ${
                    isCompleted ? "opacity-80" : ""
                  }`}
                >
                  {/* Image */}
                  {g.image_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={g.image_url}
                        alt={g.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        {isActive && <Badge className="bg-accent text-accent-foreground shadow-lg">Активен</Badge>}
                        {isCompleted && <Badge variant="secondary">Завершён</Badge>}
                        {g.status === "cancelled" && <Badge variant="destructive">Отменён</Badge>}
                      </div>
                      {g.ends_at && isActive && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-foreground bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {getTimeLeft(g.ends_at)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-32 bg-gradient-to-br from-accent/10 via-secondary to-card flex items-center justify-center">
                      <Gift className="h-12 w-12 text-accent/30" />
                      <div className="absolute top-3 right-3">
                        {isActive && <Badge className="bg-accent text-accent-foreground shadow-lg">Активен</Badge>}
                        {isCompleted && <Badge variant="secondary">Завершён</Badge>}
                        {g.status === "cancelled" && <Badge variant="destructive">Отменён</Badge>}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold leading-tight mb-1">{g.title}</h3>
                      {g.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                      )}
                    </div>

                    {/* Prize */}
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <Trophy className="h-5 w-5 text-accent shrink-0" />
                      <span className="font-semibold text-sm">{g.prize}</span>
                    </div>

                    {/* Conditions with links */}
                    {g.conditions && (g.conditions as Condition[]).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Условия</p>
                        <ul className="space-y-1.5">
                          {(g.conditions as Condition[]).map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                              <span className="flex-1">
                                {c.link ? (
                                  <a
                                    href={c.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline inline-flex items-center gap-1"
                                  >
                                    {c.text}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{c.text}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {participantCount} участников
                      </span>
                      {g.ends_at && !g.image_url && isActive && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {getTimeLeft(g.ends_at)}
                        </span>
                      )}
                    </div>

                    {/* Winner */}
                    {isCompleted && g.winner_id && (
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-accent" />
                          Победитель: {winnerProfiles[g.winner_id] || "—"}
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    <div className="mt-auto pt-2">
                      {isActive && (
                        <>
                          {myEntries[g.id] ? (
                            myEntries[g.id].status === "rejected" ? (
                              <div className="space-y-2">
                                <Button
                                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                                  onClick={async () => {
                                    await supabase.from("giveaway_entries").delete().eq("id", myEntries[g.id].id);
                                    setSelectedGiveaway(g);
                                    fetchGiveaways();
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Попробовать снова
                                </Button>
                                {myEntries[g.id].rejection_reason && (
                                  <p className="text-xs text-destructive text-center px-2">
                                    Отклонено: {myEntries[g.id].rejection_reason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button disabled className="w-full" variant="secondary">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {myEntries[g.id].status === "approved" ? "Участие подтверждено" : "На проверке"}
                              </Button>
                            )
                          ) : user ? (
                            <Button
                              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                              onClick={() => setSelectedGiveaway(g)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Участвовать
                            </Button>
                          ) : (
                            <Button className="w-full" variant="outline" onClick={() => toast.info("Войдите, чтобы участвовать")}>
                              Войти для участия
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={!!selectedGiveaway} onOpenChange={() => setSelectedGiveaway(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Участие в розыгрыше</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Выполните все условия и загрузите скриншот-подтверждение.
            </p>
            {selectedGiveaway?.conditions && (
              <div className="space-y-2 p-3 rounded-lg bg-muted">
                <p className="font-medium text-sm">Условия:</p>
                {(selectedGiveaway.conditions as Condition[]).map((c, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {c.link ? (
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                        {c.text}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      c.text
                    )}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Скриншот подтверждения *</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScreenshotUpload(file);
                }}
              />
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

