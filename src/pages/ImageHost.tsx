import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, Image as ImageIcon, Loader2, X, Copy, Check, Clock, ExternalLink, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface PreparedFile {
  original: File;
  compressed: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

interface MyUpload {
  id: string;
  slug: string;
  title: string | null;
  files: string[];
  expires_at: string;
  created_at: string;
  views_count: number;
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageHost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [files, setFiles] = useState<PreparedFile[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [days, setDays] = useState<number>(7);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [myUploads, setMyUploads] = useState<MyUpload[]>([]);

  const fetchMyUploads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("image_uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyUploads(data || []);
  }, [user]);

  useEffect(() => { fetchMyUploads(); }, [fetchMyUploads]);

  const prepareFiles = async (input: FileList | File[]) => {
    const arr = Array.from(input).filter(f => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setPreparing(true);
    try {
      const prepared: PreparedFile[] = [];
      for (const f of arr) {
        const compressed = await imageCompression(f, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2560,
          useWebWorker: true,
          initialQuality: 0.92,
          fileType: f.type === "image/png" ? "image/png" : "image/webp",
        });
        prepared.push({
          original: f,
          compressed,
          preview: URL.createObjectURL(compressed),
          originalSize: f.size,
          compressedSize: compressed.size,
        });
      }
      setFiles(prev => [...prev, ...prepared]);
    } catch (e: any) {
      toast({ title: "Ошибка сжатия", description: e.message, variant: "destructive" });
    } finally {
      setPreparing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) prepareFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpload = async () => {
    if (!user) {
      toast({ title: "Войдите, чтобы загружать", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (files.length === 0) return;

    setUploading(true);
    try {
      const slug = generateSlug();
      const uploadedPaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i].compressed;
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${slug}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage
          .from("image-hosting")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (error) throw error;
        uploadedPaths.push(path);
      }

      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error: insertError } = await supabase.from("image_uploads").insert({
        slug,
        user_id: user.id,
        title: title || null,
        files: uploadedPaths,
        expires_at: expiresAt,
      });
      if (insertError) throw insertError;

      toast({ title: "Загружено!", description: "Ссылка скопирована в буфер" });
      const url = `${window.location.origin}${window.location.pathname}#/i/${slug}`;
      try { await navigator.clipboard.writeText(url); } catch {}

      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setTitle("");
      fetchMyUploads();
      navigate(`/i/${slug}`);
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/i/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  };

  const deleteUpload = async (up: MyUpload) => {
    if (!confirm("Удалить эту загрузку?")) return;
    await supabase.storage.from("image-hosting").remove(up.files);
    await supabase.from("image_uploads").delete().eq("id", up.id);
    toast({ title: "Удалено" });
    fetchMyUploads();
  };

  const totalOriginal = files.reduce((s, f) => s + f.originalSize, 0);
  const totalCompressed = files.reduce((s, f) => s + f.compressedSize, 0);
  const savingsPct = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-4xl font-bold">Хостинг изображений</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-8">
          Загрузи фото — получи короткую ссылку. Автоматическое сжатие без потери качества. Хранение до 30 дней.
        </p>

        <Card className="glass border-0 mb-8">
          <CardContent className="pt-6 space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-accent bg-accent/10" : "border-muted-foreground/30 hover:border-accent/50"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && prepareFiles(e.target.files)}
              />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Перетащи или нажми, чтобы выбрать</p>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP — можно несколько</p>
            </div>

            {preparing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Сжатие изображений...
              </div>
            )}

            {files.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white">
                        {formatBytes(f.originalSize)} → {formatBytes(f.compressedSize)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  Итого: {formatBytes(totalOriginal)} → <span className="text-accent font-medium">{formatBytes(totalCompressed)}</span>
                  {savingsPct > 0 && <span className="ml-2">(-{savingsPct}%)</span>}
                </div>

                <div className="space-y-2">
                  <Label>Название (необязательно)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Скриншоты патруля" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Срок хранения</Label>
                    <span className="text-sm font-medium">{days} {days === 1 ? "день" : days < 5 ? "дня" : "дней"}</span>
                  </div>
                  <Slider value={[days]} onValueChange={(v) => setDays(v[0])} min={1} max={30} step={1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 день</span>
                    <span>30 дней</span>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading || preparing}
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                >
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Загрузка...</> : <><Upload className="h-4 w-4 mr-2" /> Загрузить и получить ссылку</>}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {user && myUploads.length > 0 && (
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Мои загрузки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myUploads.map((up) => {
                const expired = new Date(up.expires_at) < new Date();
                return (
                  <div key={up.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/40 hover:bg-background/60 transition">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{up.title || `Загрузка ${up.slug}`}</div>
                      <div className="text-xs text-muted-foreground">
                        {up.files.length} фото · {up.views_count} просмотров · {expired ? "истекло" : `истечёт ${formatDistanceToNow(new Date(up.expires_at), { addSuffix: true, locale: ru })}`}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyLink(up.slug)} title="Копировать ссылку">
                      {copiedSlug === up.slug ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" asChild title="Открыть">
                      <Link to={`/i/${up.slug}`}><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteUpload(up)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
