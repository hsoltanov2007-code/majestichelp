import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Law {
  id: string;
  slug: string;
  title: string;
  short_title: string;
  type: "law" | "code";
  forum_url: string | null;
  preamble: string | null;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface LawFormData {
  slug: string;
  title: string;
  short_title: string;
  type: "law" | "code";
  forum_url: string;
  preamble: string;
  content: string;
  order_index: number;
}

const emptyForm: LawFormData = {
  slug: "",
  title: "",
  short_title: "",
  type: "law",
  forum_url: "",
  preamble: "",
  content: "",
  order_index: 0,
};

export default function AdminLaws() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, isModerator, isLoading: loading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLaw, setEditingLaw] = useState<Law | null>(null);
  const [formData, setFormData] = useState<LawFormData>(emptyForm);

  const { data: laws, isLoading } = useQuery({
    queryKey: ["admin-laws"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laws")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Law[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LawFormData) => {
      const { error } = await supabase.from("laws").insert({
        slug: data.slug,
        title: data.title,
        short_title: data.short_title,
        type: data.type,
        forum_url: data.forum_url || null,
        preamble: data.preamble || null,
        content: data.content,
        order_index: data.order_index,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-laws"] });
      toast({ title: "Закон добавлен" });
      setIsDialogOpen(false);
      setFormData(emptyForm);
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LawFormData }) => {
      const { error } = await supabase
        .from("laws")
        .update({
          slug: data.slug,
          title: data.title,
          short_title: data.short_title,
          type: data.type,
          forum_url: data.forum_url || null,
          preamble: data.preamble || null,
          content: data.content,
          order_index: data.order_index,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-laws"] });
      toast({ title: "Закон обновлён" });
      setIsDialogOpen(false);
      setEditingLaw(null);
      setFormData(emptyForm);
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("laws").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-laws"] });
      toast({ title: "Закон удалён" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLaw) {
      updateMutation.mutate({ id: editingLaw.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (law: Law) => {
    setEditingLaw(law);
    setFormData({
      slug: law.slug,
      title: law.title,
      short_title: law.short_title,
      type: law.type,
      forum_url: law.forum_url || "",
      preamble: law.preamble || "",
      content: law.content,
      order_index: law.order_index,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingLaw(null);
    setFormData({
      ...emptyForm,
      order_index: (laws?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <p>Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (!isAdmin && !isModerator)) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Управление законами</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить закон
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLaw ? "Редактировать закон" : "Добавить закон"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (для URL)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="criminal-code"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short_title">Краткое название</Label>
                    <Input
                      id="short_title"
                      value={formData.short_title}
                      onChange={(e) => setFormData({ ...formData, short_title: e.target.value })}
                      placeholder="УК"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Полное название</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Уголовный кодекс штата San-Andreas"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "law" | "code") => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code">Кодекс</SelectItem>
                        <SelectItem value="law">Закон</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Порядок</Label>
                    <Input
                      id="order_index"
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forum_url">Ссылка на форум (оригинал)</Label>
                  <Input
                    id="forum_url"
                    value={formData.forum_url}
                    onChange={(e) => setFormData({ ...formData, forum_url: e.target.value })}
                    placeholder="https://forum.majestic-rp.ru/threads/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preamble">Преамбула (необязательно)</Label>
                  <Textarea
                    id="preamble"
                    value={formData.preamble}
                    onChange={(e) => setFormData({ ...formData, preamble: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Содержание закона</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    placeholder="Вставьте полный текст закона..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingLaw ? "Сохранить" : "Добавить"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p>Загрузка законов...</p>
        ) : laws?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Законы ещё не добавлены. Нажмите "Добавить закон" для создания первого.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {laws?.map((law) => (
              <Card key={law.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {law.type === "code" ? "Кодекс" : "Закон"}
                      </span>
                      <span className="text-xs text-muted-foreground">#{law.order_index}</span>
                      <span className="font-medium">{law.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Slug: {law.slug} | Краткое: {law.short_title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/laws/${law.slug}`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(law)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Удалить этот закон?")) {
                          deleteMutation.mutate(law.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
