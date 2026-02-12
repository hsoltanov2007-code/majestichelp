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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Edit, Loader2, Upload, X, Image as ImageIcon, Tag, Lock, Users, Search } from "lucide-react";

interface ReduxCategory {
  id: string;
  value: string;
  label: string;
  order_index: number;
  is_active: boolean;
  is_restricted: boolean;
}

interface CategoryAccess {
  id: string;
  category_id: string;
  user_id: string;
}

interface ProfileOption {
  id: string;
  username: string;
}

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
  const [categories, setCategories] = useState<ReduxCategory[]>([]);
  const [items, setItems] = useState<ReduxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<ReduxItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Category form
  const [newCatValue, setNewCatValue] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Access management
  const [allProfiles, setAllProfiles] = useState<ProfileOption[]>([]);
  const [categoryAccess, setCategoryAccess] = useState<Record<string, string[]>>({});
  const [accessDialogCat, setAccessDialogCat] = useState<ReduxCategory | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // Item form
  const [form, setForm] = useState({
    category: "",
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
      else fetchAll();
    }
  }, [user, canManage, authLoading]);

  const fetchAll = async () => {
    setIsLoading(true);
    const [{ data: cats }, { data: itemsData }, { data: profiles }, { data: accessData }] = await Promise.all([
      supabase.from("redux_categories").select("*").order("order_index"),
      supabase.from("redux_items").select("*").order("category").order("order_index"),
      supabase.from("profiles").select("id, username"),
      supabase.from("redux_category_access").select("*"),
    ]);
    setCategories((cats as ReduxCategory[]) || []);
    setItems((itemsData as ReduxItem[]) || []);
    setAllProfiles((profiles as ProfileOption[]) || []);
    
    // Group access by category_id
    const accessMap: Record<string, string[]> = {};
    ((accessData as CategoryAccess[]) || []).forEach((a) => {
      if (!accessMap[a.category_id]) accessMap[a.category_id] = [];
      accessMap[a.category_id].push(a.user_id);
    });
    setCategoryAccess(accessMap);
    setIsLoading(false);
  };

  // --- Category management ---
  const handleAddCategory = async () => {
    if (!newCatValue.trim() || !newCatLabel.trim()) { toast.error("Заполните оба поля"); return; }
    setIsAddingCat(true);
    const { error } = await supabase.from("redux_categories").insert({
      value: newCatValue.trim().toLowerCase().replace(/\s+/g, "-"),
      label: newCatLabel.trim(),
      order_index: categories.length,
    });
    if (error) toast.error(error.message);
    else { toast.success("Категория добавлена"); setNewCatValue(""); setNewCatLabel(""); fetchAll(); }
    setIsAddingCat(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Удалить категорию?")) return;
    const { error } = await supabase.from("redux_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Удалено"); fetchAll(); }
  };

  const handleToggleRestricted = async (cat: ReduxCategory) => {
    const newVal = !cat.is_restricted;
    const { error } = await supabase.from("redux_categories").update({ is_restricted: newVal }).eq("id", cat.id);
    if (error) toast.error(error.message);
    else {
      toast.success(newVal ? "Категория ограничена" : "Категория открыта для всех");
      if (!newVal) {
        await supabase.from("redux_category_access").delete().eq("category_id", cat.id);
      }
      fetchAll();
    }
  };

  const handleAddAccess = async (categoryId: string, userId: string) => {
    const { error } = await supabase.from("redux_category_access").insert({ category_id: categoryId, user_id: userId });
    if (error) { if (error.code === '23505') toast.error("Уже добавлен"); else toast.error(error.message); return; }
    toast.success("Доступ выдан");
    fetchAll();
  };

  const handleRemoveAccess = async (categoryId: string, userId: string) => {
    const { error } = await supabase.from("redux_category_access").delete().eq("category_id", categoryId).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Доступ убран"); fetchAll(); }
  };

  // --- Item management ---
  const resetForm = () => {
    setForm({ category: categories[0]?.value || "", title: "", description: "", video_url: "", download_url: "", image_urls: [], order_index: 0, is_active: true });
    setEditItem(null);
  };

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

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
    if (!form.category) { toast.error("Выберите категорию"); return; }
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
      fetchAll();
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
    else { toast.success("Удалено"); fetchAll(); }
  };

  const catLabel = (v: string) => categories.find((c) => c.value === v)?.label || v;

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
            <p className="text-muted-foreground">Категории и моды</p>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList className="mb-4">
            <TabsTrigger value="items">Моды</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" /> Категории
            </TabsTrigger>
          </TabsList>

          {/* === ITEMS TAB === */}
          <TabsContent value="items">
            <div className="flex justify-end mb-4">
              <Button className="gap-2" onClick={openCreate} disabled={categories.length === 0}>
                <Plus className="h-4 w-4" /> Добавить мод
              </Button>
            </div>
            {categories.length === 0 && (
              <Card className="glass border-0 mb-4"><CardContent className="py-4 text-center text-muted-foreground">Сначала добавьте категории</CardContent></Card>
            )}
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
          </TabsContent>

          {/* === CATEGORIES TAB === */}
          <TabsContent value="categories">
            <Card className="mb-4">
              <CardHeader><CardTitle>Новая категория</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Ключ (латиницей)</Label>
                    <Input placeholder="gunpack" value={newCatValue} onChange={(e) => setNewCatValue(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Название</Label>
                    <Input placeholder="Ганпаки" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} />
                  </div>
                  <Button className="self-end gap-2" onClick={handleAddCategory} disabled={isAddingCat}>
                    {isAddingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Добавить
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {categories.map((cat) => (
                <Card key={cat.id} className="glass border-0">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{cat.label}</p>
                          {cat.is_restricted && (
                            <Badge variant="outline" className="gap-1 text-denver-gold border-denver-gold/30">
                              <Lock className="h-3 w-3" /> Ограничена
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Ключ: {cat.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={cat.is_restricted ? "secondary" : "outline"}
                          size="sm"
                          className="gap-1"
                          onClick={() => handleToggleRestricted(cat)}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          {cat.is_restricted ? "Открыть" : "Ограничить"}
                        </Button>
                        {cat.is_restricted && (
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => { setAccessDialogCat(cat); setUserSearch(""); }}>
                            <Users className="h-3.5 w-3.5" />
                            {categoryAccess[cat.id]?.length || 0}
                          </Button>
                        )}
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {cat.is_restricted && categoryAccess[cat.id]?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {categoryAccess[cat.id].map((uid) => {
                          const profile = allProfiles.find((p) => p.id === uid);
                          return (
                            <Badge key={uid} variant="secondary" className="gap-1">
                              {profile?.username || uid.slice(0, 8)}
                              <button onClick={() => handleRemoveAccess(cat.id, uid)} className="ml-0.5 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Access management dialog */}
        <Dialog open={!!accessDialogCat} onOpenChange={(open) => { if (!open) setAccessDialogCat(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Доступ к «{accessDialogCat?.label}»</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {allProfiles
                  .filter((p) => p.username.toLowerCase().includes(userSearch.toLowerCase()))
                  .map((profile) => {
                    const hasAccess = accessDialogCat ? categoryAccess[accessDialogCat.id]?.includes(profile.id) : false;
                    return (
                      <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <span className="text-sm font-medium">{profile.username}</span>
                        {hasAccess ? (
                          <Button variant="destructive" size="sm" onClick={() => accessDialogCat && handleRemoveAccess(accessDialogCat.id, profile.id)}>
                            Убрать
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => accessDialogCat && handleAddAccess(accessDialogCat.id, profile.id)}>
                            Выдать
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.value}>{c.label}</SelectItem>
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
                <div className="flex gap-2">
                  <Input className="flex-1" value={form.download_url} onChange={(e) => setForm((f) => ({ ...f, download_url: e.target.value }))} placeholder="https://... или загрузите файл →" />
                  <label className="cursor-pointer flex-shrink-0">
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingFile(true);
                        setUploadProgress(0);
                        
                        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        const path = `downloads/${Date.now()}-${safeName}`;
                        
                        // Use XHR for progress tracking
                        const { data: { session } } = await supabase.auth.getSession();
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
                        
                        const xhr = new XMLHttpRequest();
                        xhr.upload.addEventListener('progress', (evt) => {
                          if (evt.lengthComputable) {
                            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
                          }
                        });
                        
                        xhr.addEventListener('load', () => {
                          if (xhr.status >= 200 && xhr.status < 300) {
                            const { data: urlData } = supabase.storage.from("redux-files").getPublicUrl(path);
                            setForm((f) => ({ ...f, download_url: urlData.publicUrl }));
                            toast.success(`Файл "${file.name}" загружен`);
                          } else {
                            toast.error("Ошибка загрузки файла");
                          }
                          setUploadingFile(false);
                          setUploadProgress(0);
                        });
                        
                        xhr.addEventListener('error', () => {
                          toast.error("Ошибка загрузки файла");
                          setUploadingFile(false);
                          setUploadProgress(0);
                        });
                        
                        xhr.open('POST', `${supabaseUrl}/storage/v1/object/redux-files/${path}`);
                        xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token || supabaseKey}`);
                        xhr.setRequestHeader('apikey', supabaseKey);
                        xhr.setRequestHeader('x-upsert', 'false');
                        xhr.send(file);
                      }}
                    />
                    <Button variant="outline" size="default" className="gap-2" asChild disabled={uploadingFile}>
                      <span>{uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Файл</span>
                    </Button>
                  </label>
                </div>
                {uploadingFile && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
                  </div>
                )}
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
