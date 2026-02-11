import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Gift,
  Trophy,
  Users,
  Shuffle,
  X,
  Check,
  Image,
  Pencil,
  Upload,
} from "lucide-react";

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

interface Entry {
  id: string;
  giveaway_id: string;
  user_id: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  profile?: { username: string };
}

export default function AdminGiveaways() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingEntries, setViewingEntries] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [conditions, setConditions] = useState<{ text: string; link: string }[]>([{ text: "", link: "" }]);
  const [endsAt, setEndsAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdmin();
      fetchGiveaways();
    }
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (data?.role === "admin" || data?.role === "moderator") {
      setIsAdmin(true);
    } else {
      navigate("/");
    }
  };

  const fetchGiveaways = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });
    setGiveaways((data as unknown as Giveaway[]) || []);

    const counts: Record<string, number> = {};
    for (const g of data || []) {
      const { count } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true })
        .eq("giveaway_id", g.id);
      counts[g.id] = count || 0;
    }
    setEntryCounts(counts);
    setIsLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrize("");
    setConditions([{ text: "", link: "" }]);
    setEndsAt("");
    setImageUrl("");
    setImageFile(null);
    setImagePreview(null);
    setStatus("active");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (g: Giveaway) => {
    setEditingId(g.id);
    setTitle(g.title);
    setDescription(g.description || "");
    setPrize(g.prize);
    setConditions(
      g.conditions && (g.conditions as { text: string; link?: string }[]).length > 0
        ? (g.conditions as { text: string; link?: string }[]).map(c => ({ text: c.text, link: c.link || "" }))
        : [{ text: "", link: "" }]
    );
    setEndsAt(g.ends_at ? g.ends_at.slice(0, 16) : "");
    setImageUrl(g.image_url || "");
    setImageFile(null);
    setImagePreview(null);
    setStatus(g.status);
    setIsFormOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `giveaway-images/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("giveaway-screenshots").upload(path, file);
    if (error) {
      console.error("Image upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("giveaway-screenshots").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prize.trim()) {
      toast.error("Заполните название и приз");
      return;
    }

    setIsImageUploading(true);

    let finalImageUrl = imageUrl.trim() || null;

    // Upload image file if selected
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) {
        finalImageUrl = uploaded;
      } else {
        toast.error("Ошибка загрузки изображения");
        setIsImageUploading(false);
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      prize: prize.trim(),
      conditions: conditions.filter(c => c.text.trim()).map(c => ({ text: c.text.trim(), ...(c.link.trim() ? { link: c.link.trim() } : {}) })),
      ends_at: endsAt || null,
      image_url: finalImageUrl,
      status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("giveaways")
        .update(payload as any)
        .eq("id", editingId);
      if (error) {
        toast.error("Ошибка обновления");
        console.error(error);
      } else {
        toast.success("Розыгрыш обновлён!");
        setIsFormOpen(false);
        resetForm();
        fetchGiveaways();
      }
    } else {
      const { error } = await supabase.from("giveaways").insert({
        ...payload,
        created_by: user!.id,
      } as any);
      if (error) {
        toast.error("Ошибка создания");
        console.error(error);
      } else {
        toast.success("Розыгрыш создан!");
        setIsFormOpen(false);
        resetForm();
        fetchGiveaways();
      }
    }
    setIsImageUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить розыгрыш?")) return;
    await supabase.from("giveaways").delete().eq("id", id);
    toast.success("Удалено");
    fetchGiveaways();
  };

  const viewEntries = async (giveawayId: string) => {
    setViewingEntries(giveawayId);
    const { data } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("giveaway_id", giveawayId)
      .order("created_at", { ascending: true });

    const entriesData = (data as unknown as Entry[]) || [];
    const userIds = entriesData.map(e => e.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
      entriesData.forEach(e => {
        e.profile = profiles?.find(p => p.id === e.user_id) || { username: "—" };
      });
    }
    setEntries(entriesData);
  };

  const handleApproveEntry = async (entryId: string, entryStatus: "approved" | "rejected") => {
    await supabase
      .from("giveaway_entries")
      .update({ status: entryStatus } as any)
      .eq("id", entryId);
    toast.success(entryStatus === "approved" ? "Одобрено" : "Отклонено");
    if (viewingEntries) viewEntries(viewingEntries);
  };

  const pickRandomWinner = async (giveawayId: string) => {
    const approved = entries.filter(e => e.status === "approved");
    if (approved.length === 0) {
      toast.error("Нет одобренных участников");
      return;
    }
    const winner = approved[Math.floor(Math.random() * approved.length)];
    await supabase
      .from("giveaways")
      .update({ winner_id: winner.user_id, status: "completed" } as any)
      .eq("id", giveawayId);
    toast.success(`Победитель: ${winner.profile?.username || "—"}`);
    fetchGiveaways();
    viewEntries(giveawayId);
  };

  const pickManualWinner = async (giveawayId: string, userId: string) => {
    await supabase
      .from("giveaways")
      .update({ winner_id: userId, status: "completed" } as any)
      .eq("id", giveawayId);
    toast.success("Победитель выбран!");
    fetchGiveaways();
    viewEntries(giveawayId);
  };

  if (authLoading || isLoading || !isAdmin) {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Управление розыгрышами</h1>
            </div>
          </div>

          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </div>

        {/* Giveaways list */}
        <Card>
          <CardHeader>
            <CardTitle>Розыгрыши ({giveaways.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {giveaways.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Розыгрышей пока нет</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Приз</TableHead>
                    <TableHead>Участников</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giveaways.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.title}</TableCell>
                      <TableCell>{g.prize}</TableCell>
                      <TableCell>{entryCounts[g.id] || 0}</TableCell>
                      <TableCell>
                        <Badge variant={g.status === "active" ? "default" : "secondary"}>
                          {g.status === "active" ? "Активен" : g.status === "completed" ? "Завершён" : "Отменён"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(g)} title="Редактировать">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => viewEntries(g.id)} title="Участники">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)} title="Удалить">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); resetForm(); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Редактировать розыгрыш" : "Новый розыгрыш"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Розыгрыш VIP" required />
              </div>
              <div className="space-y-2">
                <Label>Приз *</Label>
                <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="VIP статус на месяц" required />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробности розыгрыша..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Изображение</Label>
                {(imagePreview || imageUrl) && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => { setImageFile(null); setImagePreview(null); setImageUrl(""); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Условия участия</Label>
                {conditions.map((c, i) => (
                  <div key={i} className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex gap-2">
                      <Input
                        value={c.text}
                        onChange={(e) => {
                          const newC = [...conditions];
                          newC[i] = { ...newC[i], text: e.target.value };
                          setConditions(newC);
                        }}
                        placeholder={`Условие ${i + 1}`}
                      />
                      {conditions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setConditions(conditions.filter((_, j) => j !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={c.link}
                      onChange={(e) => {
                        const newC = [...conditions];
                        newC[i] = { ...newC[i], link: e.target.value };
                        setConditions(newC);
                      }}
                      placeholder="Ссылка (необязательно)"
                      className="text-xs"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setConditions([...conditions, { text: "", link: "" }])}>
                  <Plus className="h-3 w-3 mr-1" /> Добавить условие
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Дата окончания (опционально)</Label>
                <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              {editingId && (
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="active">Активен</option>
                    <option value="completed">Завершён</option>
                    <option value="cancelled">Отменён</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>Отмена</Button>
                <Button type="submit" disabled={isImageUploading}>
                  {isImageUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Entries dialog */}
        <Dialog open={!!viewingEntries} onOpenChange={() => setViewingEntries(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Участники ({entries.length})
              </DialogTitle>
            </DialogHeader>

            {viewingEntries && giveaways.find(g => g.id === viewingEntries)?.status === "active" && (
              <div className="flex gap-2">
                <Button onClick={() => pickRandomWinner(viewingEntries)} variant="outline">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Случайный победитель
                </Button>
              </div>
            )}

            {entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Участников пока нет</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Скриншот</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const giveaway = giveaways.find(g => g.id === viewingEntries);
                    const isWinner = giveaway?.winner_id === entry.user_id;
                    return (
                      <TableRow key={entry.id} className={isWinner ? "bg-primary/10" : ""}>
                        <TableCell className="font-medium">
                          {entry.profile?.username || "—"}
                          {isWinner && <Trophy className="h-4 w-4 inline ml-1 text-primary" />}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setScreenshotPreview(entry.screenshot_url)}>
                            <Image className="h-4 w-4 mr-1" /> Просмотр
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.status === "approved" ? "default" : entry.status === "rejected" ? "destructive" : "secondary"}>
                            {entry.status === "approved" ? "Одобрен" : entry.status === "rejected" ? "Отклонён" : "Ожидает"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(entry.created_at).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {entry.status !== "approved" && (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveEntry(entry.id, "approved")}>
                                <Check className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            {entry.status !== "rejected" && (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveEntry(entry.id, "rejected")}>
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            {giveaway?.status === "active" && (
                              <Button variant="ghost" size="sm" onClick={() => pickManualWinner(viewingEntries!, entry.user_id)}>
                                <Trophy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>

        {/* Screenshot preview */}
        <Dialog open={!!screenshotPreview} onOpenChange={() => setScreenshotPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Скриншот</DialogTitle>
            </DialogHeader>
            {screenshotPreview && (
              <img src={screenshotPreview} alt="Screenshot" className="w-full rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
