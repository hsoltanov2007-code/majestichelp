import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Database,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";

interface KnowledgeEntry {
  id: string;
  source_url: string;
  title: string;
  content: string;
  category: string;
  parsed_at: string;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "criminal_code", label: "Уголовный кодекс" },
  { value: "administrative_code", label: "Административный кодекс" },
  { value: "traffic_code", label: "Дорожный кодекс" },
  { value: "constitution", label: "Конституция" },
  { value: "government_rules", label: "Правила гос. организаций" },
  { value: "labor_code", label: "Трудовой кодекс" },
  { value: "procedural_code", label: "Процессуальный кодекс" },
  { value: "server_rules", label: "Правила сервера" },
  { value: "other", label: "Другое" },
];

export default function AdminKnowledgeBase() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("other");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminRole();
      fetchEntries();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAccess = data?.some(r => r.role === "admin" || r.role === "moderator");
    if (hasAccess) {
      setIsAdmin(true);
    } else {
      navigate("/");
    }
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      console.error("Error fetching entries:", error);
      toast.error("Ошибка загрузки данных");
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from("knowledge_base")
          .update({
            title: title.trim(),
            source_url: sourceUrl.trim() || `manual-${Date.now()}`,
            content: content.trim(),
            category,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEntry.id);

        if (error) throw error;
        toast.success("Запись обновлена");
      } else {
        const { error } = await supabase.from("knowledge_base").insert({
          title: title.trim(),
          source_url: sourceUrl.trim() || `manual-${Date.now()}`,
          content: content.trim(),
          category,
          is_active: true,
        });

        if (error) throw error;
        toast.success("Запись добавлена");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setSourceUrl(entry.source_url);
    setContent(entry.content);
    setCategory(entry.category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись?")) return;

    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);

    if (error) {
      console.error("Error deleting entry:", error);
      toast.error("Ошибка удаления");
    } else {
      toast.success("Запись удалена");
      fetchEntries();
    }
  };

  const handleToggleActive = async (entry: KnowledgeEntry) => {
    const { error } = await supabase
      .from("knowledge_base")
      .update({ is_active: !entry.is_active })
      .eq("id", entry.id);

    if (error) {
      toast.error("Ошибка обновления");
    } else {
      fetchEntries();
    }
  };

  const handleRunParser = async () => {
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-forum", {
        body: {},
      });

      if (error) throw error;

      toast.success(data.message || "Парсинг завершён");
      fetchEntries();
    } catch (error) {
      console.error("Parser error:", error);
      toast.error("Ошибка парсинга форума");
    } finally {
      setIsParsing(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSourceUrl("");
    setContent("");
    setCategory("other");
    setEditingEntry(null);
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
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
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">База знаний AI</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRunParser}
              disabled={isParsing}
            >
              {isParsing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Парсить форум
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? "Редактировать запись" : "Новая запись"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Название *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Уголовный кодекс"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Категория</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">URL источника (опционально)</Label>
                    <Input
                      id="sourceUrl"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://forum.majestic-rp.ru/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Содержание *</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Вставьте текст законов или правил..."
                      rows={15}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Поддерживается Markdown форматирование
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit">
                      {editingEntry ? "Сохранить" : "Добавить"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Записи базы знаний ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                База знаний пуста. Добавьте записи вручную или запустите парсинг.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Обновлено</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {entry.title}
                      </TableCell>
                      <TableCell>{getCategoryLabel(entry.category)}</TableCell>
                      <TableCell>
                        {(entry.content.length / 1024).toFixed(1)} KB
                      </TableCell>
                      <TableCell>
                        {new Date(entry.parsed_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={entry.is_active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleActive(entry)}
                        >
                          {entry.is_active ? "Активна" : "Отключена"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                          >
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
      </div>
    </Layout>
  );
}
