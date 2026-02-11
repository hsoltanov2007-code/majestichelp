import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Loader2, GripVertical, Pencil, Image,
} from "lucide-react";

interface AdBanner {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  link_text: string | null;
  is_active: boolean;
  order_index: number;
}

export default function AdminAds() {
  const navigate = useNavigate();
  const { user, canManage, isLoading: authLoading } = useAuth();
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!canManage) {
        toast.error("Доступ запрещён");
        navigate("/");
      } else fetchBanners();
    }
  }, [user, canManage, authLoading]);

  const fetchBanners = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("ad_banners")
      .select("*")
      .order("order_index");
    setBanners(data || []);
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setLinkText("");
  };

  const handleEdit = (b: AdBanner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setDescription(b.description || "");
    setImageUrl(b.image_url || "");
    setLinkUrl(b.link_url);
    setLinkText(b.link_text || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !linkUrl.trim()) {
      toast.error("Заполните название и ссылку");
      return;
    }

    setIsSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      link_url: linkUrl.trim(),
      link_text: linkText.trim() || "Подробнее",
    };

    if (editingId) {
      const { error } = await supabase
        .from("ad_banners")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId);
      if (error) toast.error("Ошибка сохранения");
      else toast.success("Баннер обновлён");
    } else {
      const { error } = await supabase.from("ad_banners").insert({
        ...payload,
        order_index: banners.length,
      });
      if (error) toast.error("Ошибка создания");
      else toast.success("Баннер создан");
    }

    resetForm();
    fetchBanners();
    setIsSaving(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase
      .from("ad_banners")
      .update({ is_active: !isActive })
      .eq("id", id);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить баннер?")) return;
    await supabase.from("ad_banners").delete().eq("id", id);
    toast.success("Баннер удалён");
    fetchBanners();
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Image className="h-6 w-6" />
              Рекламные баннеры
            </h1>
            <p className="text-muted-foreground">Сайдбар-реклама на всех страницах</p>
          </div>
        </div>

        {/* Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Редактировать баннер" : "Новый баннер"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Majestic RP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ссылка *</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Короткое описание..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL картинки</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://...image.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Текст кнопки</Label>
                  <Input
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Подробнее"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : editingId ? (
                    <Pencil className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Сохранить" : "Добавить"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Отмена
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {banners.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Нет баннеров. Создайте первый!
            </p>
          )}
          {banners.map((b) => (
            <Card key={b.id} className={!b.is_active ? "opacity-50" : ""}>
              <CardContent className="py-3 flex items-center gap-4">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {b.image_url && (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-16 h-10 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {b.link_url}
                  </p>
                </div>
                <Switch
                  checked={b.is_active}
                  onCheckedChange={() => handleToggleActive(b.id, b.is_active)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(b)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(b.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
