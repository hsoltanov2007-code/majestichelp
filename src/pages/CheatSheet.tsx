import { Layout } from "@/components/Layout";
import { ExternalLink, Heart, Scale, FileText, Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import { useArticles } from "@/hooks/useArticles";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { detentionProcedure, detentionGrounds, releaseGrounds, detentionSubjects } from "@/data/administrativeCode";

interface ArticleItemProps {
  id: string;
  article: string;
  description: string;
  fine?: string;
  isChild?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  type: "criminal" | "admin";
  stars?: number;
}

const ArticleItem = ({ 
  id, 
  article, 
  description, 
  fine, 
  isChild, 
  isFavorite, 
  onToggleFavorite,
  type,
  stars
}: ArticleItemProps) => {
  // Determine border color based on severity (for criminal articles)
  const getBorderColor = () => {
    if (type === "admin") return "border-l-accent";
    if (stars && stars >= 5) return "border-l-destructive";
    if (stars && stars >= 3) return "border-l-accent";
    return "border-l-emerald-500";
  };

  // Parse article number
  const getArticleNumber = () => {
    const match = article.match(/^([\d.]+\s*(?:ч\.\d+)?)/);
    return match ? match[1].replace("ч.", "ч.") : article;
  };

  const articleNum = getArticleNumber();
  const isSubPart = article.includes("ч.") || isChild;

  return (
    <div 
      className={cn(
        "relative border-l-4 rounded-r-lg bg-card/30 hover:bg-card/50 transition-colors",
        getBorderColor(),
        isSubPart && "ml-4"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <span className={cn(
          "font-mono text-sm font-semibold shrink-0 min-w-[60px]",
          type === "criminal" ? "text-destructive" : "text-accent"
        )}>
          {articleNum}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{description}</p>
          {fine && (
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{fine}</p>
          )}
        </div>
        {onToggleFavorite && (
          <button 
            onClick={onToggleFavorite}
            className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
          >
            <Heart 
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"
              )} 
            />
          </button>
        )}
      </div>
    </div>
  );
};

interface ProcedureBlockProps {
  title: string;
  items: string[];
}

const ProcedureBlock = ({ title, items }: ProcedureBlockProps) => (
  <div className="space-y-2">
    <h4 className="text-sm font-bold text-foreground border-b border-border/50 pb-1">{title}</h4>
    <ol className="space-y-1 text-xs text-muted-foreground">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-foreground font-medium shrink-0">{idx + 1}.</span>
          <span className="leading-tight">{item}</span>
        </li>
      ))}
    </ol>
  </div>
);

export default function CheatSheet() {
  const { data, isLoading } = useArticles();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Prepare criminal articles - group by parent
  const criminalArticles = data?.criminalArticles || [];
  const adminArticles = data?.adminArticles || [];

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text-accent mb-2">Шпаргалка</h1>
          <p className="text-muted-foreground">Быстрый справочник по всем кодексам</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Criminal Code Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Scale className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-bold">Уголовный кодекс</h2>
                <Link 
                  to="/criminal-code" 
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {criminalArticles.map((article: any) => (
                  <ArticleItem
                    key={article.id}
                    id={article.id}
                    article={article.article}
                    description={article.description}
                    fine={article.fine || undefined}
                    isChild={!!article.parentArticle}
                    isFavorite={isFavorite(article.id, "criminal")}
                    onToggleFavorite={() => toggleFavorite({
                      id: article.id,
                      article: article.article,
                      description: article.description,
                      type: "criminal"
                    })}
                    type="criminal"
                    stars={article.stars}
                  />
                ))}
              </div>
            </div>

            {/* Administrative Code Column */}
            <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold">Административный кодекс</h2>
                <Link
                  to="/administrative-code" 
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                {adminArticles.map((article: any) => (
                  <ArticleItem
                    key={article.id}
                    id={article.id}
                    article={article.article}
                    description={article.description}
                    fine={article.fine}
                    isChild={!!article.subPart}
                    isFavorite={isFavorite(article.id, "administrative")}
                    onToggleFavorite={() => toggleFavorite({
                      id: article.id,
                      article: article.article,
                      description: article.description,
                      type: "administrative"
                    })}
                    type="admin"
                  />
                ))}
              </div>
            </div>

            {/* Procedural Code Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Gavel className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Процессуальный кодекс</h2>
                <Link 
                  to="/procedural-code" 
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                <ProcedureBlock 
                  title="Порядок задержания" 
                  items={detentionProcedure} 
                />
                
                <ProcedureBlock 
                  title="Основания для задержания" 
                  items={detentionGrounds} 
                />
                
                <ProcedureBlock 
                  title="Основания для освобождения" 
                  items={releaseGrounds} 
                />
                
                <ProcedureBlock 
                  title="Субъекты задержания" 
                  items={detentionSubjects} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </Layout>
  );
}
