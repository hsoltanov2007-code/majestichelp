import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Image as ImageIcon, Clock, Download, Copy, Check, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface UploadData {
  id: string;
  slug: string;
  title: string | null;
  files: string[];
  expires_at: string;
  created_at: string;
  views_count: number;
}

export default function ImageView() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<UploadData | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: up, error: e } = await supabase
        .from("image_uploads")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (e || !up) {
        setError("Загрузка не найдена или срок хранения истёк");
        setLoading(false);
        return;
      }

      const { data: signed } = await supabase.storage
        .from("image-hosting")
        .createSignedUrls(up.files, 60 * 60 * 24);

      setUrls((signed || []).map(s => s.signedUrl).filter(Boolean) as string[]);
      setData(up);
      setLoading(false);

      supabase.from("image_uploads").update({ views_count: up.views_count + 1 }).eq("id", up.id).then(() => {});
    })();
  }, [slug]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Не найдено</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild><Link to="/image-host">К загрузке</Link></Button>
        </div>
      </Layout>
    );
  }

  const downloadImage = async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const name = urls.length > 1 ? `majesticHARDY-${index + 1}.${ext}` : `majesticHARDY.${ext}`;
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/image-host"><ArrowLeft className="h-4 w-4 mr-1" /> К загрузке</Link>
            </Button>
            <h1 className="text-3xl font-bold">{data.title || "Изображения"}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>{data.files.length} фото</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> истечёт {formatDistanceToNow(new Date(data.expires_at), { addSuffix: true, locale: ru })}</span>
            </p>
          </div>
          <Button onClick={copyLink} variant="outline">
            {copied ? <><Check className="h-4 w-4 mr-2 text-accent" /> Скопировано</> : <><Copy className="h-4 w-4 mr-2" /> Копировать ссылку</>}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url, i) => (
            <Card key={i} className="glass border-0 overflow-hidden group cursor-pointer" onClick={() => setLightbox(url)}>
              <CardContent className="p-0 relative">
                <img src={url} alt={`Изображение ${i + 1}`} className="w-full h-64 object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <a
                  href={url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </div>
    </Layout>
  );
}
