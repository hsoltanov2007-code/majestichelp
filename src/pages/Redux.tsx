import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Download, Play, ImageIcon, ChevronDown, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReduxCategory {
  id: string;
  value: string;
  label: string;
  order_index: number;
}

interface ReduxItem {
  id: string;
  category: string;
  title: string;
  description: string | null;
  video_url: string | null;
  image_urls: string[];
  download_url: string | null;
  created_at: string;
}

export default function Redux() {
  const [categories, setCategories] = useState<ReduxCategory[]>([]);
  const [items, setItems] = useState<ReduxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([fetchCategories(), fetchItems()]).then(() => setIsLoading(false));
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("redux_categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    setCategories((data as ReduxCategory[]) || []);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("redux_items")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    setItems((data as ReduxItem[]) || []);
  };

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  const grouped = categories.reduce((acc, cat) => {
    const catItems = filtered.filter((i) => i.category === cat.value);
    if (catItems.length > 0) acc.push({ ...cat, items: catItems });
    return acc;
  }, [] as (ReduxCategory & { items: ReduxItem[] })[]);

  const getVideoEmbed = (url: string) => {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return null;
  };

  const catLabel = (v: string) => categories.find((c) => c.value === v)?.label || v;

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Redux / Моды</h1>
          <p className="text-muted-foreground">
            Majestic RP | <span className="text-accent font-semibold">Denver</span> — редуксы, ганпаки, одежда и другие моды
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className="rounded-full"
          >
            Все
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.value)}
              className="rounded-full"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-12 text-center text-muted-foreground">
              Пока нет материалов в этой категории
            </CardContent>
          </Card>
        ) : activeCategory !== "all" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ReduxCard key={item.id} item={item} getVideoEmbed={getVideoEmbed} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <Collapsible
                key={group.value}
                open={openCategories[group.value] !== false}
                onOpenChange={(open) => setOpenCategories((p) => ({ ...p, [group.value]: open }))}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between glass border-0 h-12 text-base">
                    <span className="flex items-center gap-2">
                      {group.label}
                      <Badge variant="secondary">{group.items.length}</Badge>
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openCategories[group.value] !== false ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <ReduxCard key={item.id} item={item} getVideoEmbed={getVideoEmbed} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ReduxCard({ item, getVideoEmbed }: { item: ReduxItem; getVideoEmbed: (url: string) => string | null }) {
  const [showImages, setShowImages] = useState(false);
  const embedUrl = item.video_url ? getVideoEmbed(item.video_url) : null;

  return (
    <Card className="glass border-0 hover-lift overflow-hidden">
      {embedUrl && (
        <div className="aspect-video">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      )}
      {!embedUrl && item.image_urls?.length > 0 && (
        <div className="aspect-video overflow-hidden">
          <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
        {item.image_urls?.length > (embedUrl ? 0 : 1) && (
          <>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowImages(!showImages)}>
              <ImageIcon className="h-4 w-4" />
              {showImages ? "Скрыть" : "Показать"} фото ({item.image_urls.length})
            </Button>
            {showImages && (
              <div className="grid grid-cols-2 gap-2">
                {item.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`${item.title} ${i + 1}`} className="rounded-lg w-full h-24 object-cover hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
        {item.download_url && (
          <Button asChild size="sm" className="w-full gap-2">
            <a href={item.download_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" /> Скачать
            </a>
          </Button>
        )}
        {item.video_url && !embedUrl && (
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <a href={item.video_url} target="_blank" rel="noopener noreferrer">
              <Play className="h-4 w-4" /> Смотреть видео
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
