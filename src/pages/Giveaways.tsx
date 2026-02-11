import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Gift, Clock, Users, Trophy, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  conditions: { text: string }[];
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

      // Fetch entry counts
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

      // Fetch winner profiles
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary">Активен</Badge>;
      case "completed":
        return <Badge variant="secondary">Завершён</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменён</Badge>;
      default:
        return null;
    }
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
        <div className="flex items-center gap-3 mb-6">
          <Gift className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Розыгрыши</h1>
        </div>

        {giveaways.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Пока нет активных розыгрышей</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((g) => (
              <Card key={g.id} className="flex flex-col">
                {g.image_url && (
                  <img
                    src={g.image_url}
                    alt={g.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{g.title}</CardTitle>
                    {getStatusBadge(g.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {g.description && (
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Trophy className="h-4 w-4" />
                    <span>{g.prize}</span>
                  </div>

                  {g.conditions && (g.conditions as { text: string }[]).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Условия:</p>
                      <ul className="space-y-1">
                        {(g.conditions as { text: string }[]).map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            {c.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {entries[g.id]?.length || 0} участников
                    </span>
                    {g.ends_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        до {new Date(g.ends_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>

                  {g.status === "completed" && g.winner_id && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Победитель: {winnerProfiles[g.winner_id] || "—"}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {g.status === "active" && (
                    <>
                      {myEntries[g.id] ? (
                        <Button disabled className="w-full" variant="secondary">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Вы участвуете
                        </Button>
                      ) : user ? (
                        <Button
                          className="w-full"
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
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

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
                {(selectedGiveaway.conditions as { text: string }[]).map((c, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {c.text}
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
