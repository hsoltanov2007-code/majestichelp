import { Layout } from "@/components/Layout";
import { allLawsList } from "@/data/allLaws";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DbLaw {
  id: string;
  slug: string;
  title: string;
  short_title: string;
  type: "law" | "code";
  order_index: number;
}

export default function LawsList() {
  // Получаем законы из БД
  const { data: dbLaws } = useQuery({
    queryKey: ["laws-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laws")
        .select("id, slug, title, short_title, type, order_index")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as DbLaw[];
    },
  });

  // Объединяем БД и статические данные, приоритет БД
  const dbSlugs = new Set(dbLaws?.map(l => l.slug) || []);
  const staticLaws = allLawsList.filter(l => !dbSlugs.has(l.id));
  
  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Законы</h1>
            <p className="text-muted-foreground">Нормативно-правовые акты штата Сан-Андреас</p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Законы из БД */}
          {dbLaws?.map((law) => (
            <Link
              key={law.id}
              to={`/laws/${law.slug}`}
              className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {law.type === "code" ? "Кодекс" : "Закон"}
                </span>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {law.title}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
          
          {/* Статические законы (fallback) */}
          {staticLaws.map((law) => (
            <Link
              key={law.id}
              to={`/laws/${law.id}`}
              className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                  {law.type === "code" ? "Кодекс" : "Закон"}
                </span>
                <span className="text-foreground group-hover:text-primary transition-colors">
                  {law.title}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
