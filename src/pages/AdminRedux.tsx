import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Edit, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

const CATEGORIES = [
  { value: "redux", label: "Редуксы" },
  { value: "gunpack", label: "Ганпаки" },
  { value: "clothes", label: "Одежда" },
  { value: "world", label: "Мир" },
  { value: "builds", label: "Сборки" },
  { value: "guides", label: "Гайды" },
  { value: "other", label: "Другое" },
];

interface ReduxItem {
  id: string;
  category: string;
  title: string;
  description: string | null;
  video_url: string | null;
  image_urls: string[];
  download_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminRedux() {
  const navigate = useNavigate();
  const { user, canManage, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ReduxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<ReduxItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form state
  const [form, setForm] = useState({
    category: "redux",
    title: "",
    description: "",
    video_url: "",
    download_url: "",
    image_urls: [] as string[],
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!canManage) { toast.error("Доступ запрещён"); navigate("/"); }
      else fetchItems();
    }
  }, [user, canManage, authLoading]);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("redux_items")
      .select("*")
      .order("category")
      .order("order_index");
    setItems((data as ReduxItem[]) || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setForm({ category: "redux", title: "", description: "", video_url: "", download_url: "", image_urls: [], order_index: 0, is_active: true });
    setEditItem(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (item: ReduxItem) => {
    setEditItem(item);
    setForm({
      category: item.category,
      title: item.title,
      description: item.description || "",
      video_url: item.video_url || "",
      download_url: item.download_url || "",
      image_urls: item.image_urls || [],
      order_index: item.order_index,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("redux-files").upload(path, file);
      if (error) { toast.error(`Ошибка загрузки ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("redux-files").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...newUrls] }));
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Введите название"); return; }
    setIsSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url.trim() || null,
        download_url: form.download_url.trim() || null,
        image_urls: form.image_urls,
        order_index: form.order_index,
        is_active: form.is_active,
      };

      if (editItem) {
        const { error } = await supabase.from("redux_items").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Обновлено");
      } else {
        const { error } = await supabase.from("redux_items").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
        toast.success("Добавлено");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить?")) return;
    const { error } = await supabase.from("redux_items").delete().eq("id", id);
    if (error) toast.error("Ошибка удаления");
    else { toast.success("Удалено"); fetchItems(); }
  };

  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label || v;

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Управление Redux / Моды</h1>
            <p className="text-muted-foreground">Добавляйте и редактируйте моды</p>
          </div>
          <Button className="ml-auto gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          {items.length === 0 ? (
            <Card className="glass border-0"><CardContent className="py-8 text-center text-muted-foreground">Нет материалов</CardContent></Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className={`glass border-0 ${!item.is_active ? "opacity-50" : ""}`}>
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{catLabel(item.category)}</Badge>
                      {!item.is_active && <Badge variant="outline">Скрыт</Badge>}
                      {item.image_urls?.length > 0 && (
                        <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" />{item.image_urls.length}</Badge>
                      )}
                    </div>
                    <p className="font-medium truncate">{item.title}</p>
                    {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? "Редактировать" : "Добавить"} мод</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Название мода" />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Описание..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Ссылка на видео (YouTube)</Label>
                <Input value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="space-y-2">
                <Label>Ссылка для скачивания</Label>
                <Input value={form.download_url} onChange={(e) => setForm((f) => ({ ...f, download_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Изображения</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.image_urls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" className="gap-2" asChild disabled={uploadingImages}>
                    <span>{uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить фото</span>
                  </Button>
                </label>
              </div>
              <div className="space-y-2">
                <Label>Порядок отображения</Label>
                <Input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>Активен (видим пользователям)</Label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editItem ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
