import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, ChevronRight, List, BookOpen, FileText, AlertCircle, Bookmark, Link2 } from "lucide-react";
import { useLegalArticles, LegalArticle } from "@/hooks/useLegalArticles";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

interface LegalCodePageProps {
  sourceShortName: string;
  title: string;
  favoriteType: string;
  icon?: string;
  basePath: string;
}

export function LegalCodePage({ sourceShortName, title, favoriteType, basePath }: LegalCodePageProps) {
  const { articles, isLoading, error, totalCount } = useLegalArticles(sourceShortName);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNavigation, setShowNavigation] = useState(true);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [openArticles, setOpenArticles] = useState<string[]>([]);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  const sections = useMemo(() => {
    const sectionMap = new Map<string, Map<string, LegalArticle[]>>();
    articles.forEach((article) => {
      const sectionKey = article.section_name || "Общие положения";
      const chapterKey = article.chapter_name || "Основные статьи";
      if (!sectionMap.has(sectionKey)) sectionMap.set(sectionKey, new Map());
      const chapters = sectionMap.get(sectionKey)!;
      if (!chapters.has(chapterKey)) chapters.set(chapterKey, []);
      chapters.get(chapterKey)!.push(article);
    });
    return Array.from(sectionMap.entries()).map(([sectionTitle, chapters]) => ({
      title: sectionTitle,
      id: sectionTitle.replace(/\s+/g, "-").toLowerCase(),
      chapters: Array.from(chapters.entries()).map(([chapterTitle, arts]) => ({
        title: chapterTitle,
        id: chapterTitle.replace(/\s+/g, "-").toLowerCase(),
        articles: arts,
      })),
    }));
  }, [articles]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return articles.filter((a) =>
      a.article_number.toLowerCase().includes(q) ||
      a.article_title.toLowerCase().includes(q) ||
      a.parts.some((p) => p.text.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [searchQuery, articles]);

  const scrollToChapter = (chapterId: string) => {
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveChapter(chapterId);
    }
  };

  const handleToggleFavorite = (article: LegalArticle) => {
    const wasFav = isFavorite(article.article_number, favoriteType);
    toggleFavorite({ id: article.article_number, type: favoriteType, article: `Ст. ${article.article_number}`, description: article.article_title });
    toast({ title: wasFav ? "Удалено из избранного" : "Добавлено в избранное", description: `Ст. ${article.article_number}` });
  };

  const handleCopyLink = (articleNumber: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${basePath}?article=${articleNumber}`);
    toast({ title: "Ссылка скопирована" });
  };

  useEffect(() => {
    const articleParam = searchParams.get("article");
    if (articleParam && !isLoading) {
      const found = articles.find((a) => a.article_number === articleParam);
      if (found) {
        setOpenArticles((prev) => [...prev, found.id]);
        setTimeout(() => {
          const el = document.getElementById(`article-${found.article_number}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-1", "ring-accent/50");
            setTimeout(() => el.classList.remove("ring-1", "ring-accent/50"), 2000);
          }
        }, 300);
      }
    }
  }, [searchParams, isLoading, articles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">Загрузка...</p>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm">Ошибка загрузки: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8 opacity-0 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Denver · <span className="text-accent">{totalCount}</span> статей
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowNavigation(!showNavigation)} className="lg:hidden h-8 text-xs gap-1.5">
            <List className="h-3.5 w-3.5" />
            Главы
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8 opacity-0 animate-fade-up stagger-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Поиск по статьям... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm bg-card/40 border-border/30 rounded-xl focus:border-accent/30 focus:ring-accent/10"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchQuery("")}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {searchQuery.length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-card/95 backdrop-blur-2xl border border-border/30 rounded-xl shadow-2xl shadow-background/50 overflow-hidden">
              <ScrollArea className="max-h-[360px]">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Ничего не найдено</p>
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border/20">
                      Найдено: {searchResults.length}
                    </div>
                    {searchResults.map((article) => (
                      <button key={article.id}
                        className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/10 last:border-0"
                        onClick={() => {
                          setOpenArticles((prev) => [...prev, article.id]);
                          setSearchQuery("");
                          scrollToChapter((article.chapter_name || "Основные статьи").replace(/\s+/g, "-").toLowerCase());
                        }}>
                        <div className="flex items-start gap-3">
                          <span className="text-[11px] font-mono text-accent shrink-0 mt-0.5">Ст. {article.article_number}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{article.article_title}</p>
                            {article.parts[0] && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.parts[0].text.substring(0, 100)}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Navigation Sidebar */}
          <aside className={`${showNavigation ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0`}>
            <div className="sticky top-20">
              <div className="rounded-xl border border-border/20 bg-card/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/15">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Содержание
                  </h3>
                </div>
                <ScrollArea className="h-[calc(100vh-260px)]">
                  <div className="p-2">
                    {sections.map((section) => (
                      <div key={section.id} className="mb-4">
                        <p className="text-[10px] font-semibold text-muted-foreground/60 px-2 py-1 uppercase tracking-widest">
                          {section.title}
                        </p>
                        <div className="space-y-px">
                          {section.chapters.map((chapter) => (
                            <button key={chapter.id}
                              onClick={() => { scrollToChapter(chapter.id); setShowNavigation(false); }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                                activeChapter === chapter.id
                                  ? "text-accent bg-accent/5"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                              }`}>
                              <ChevronRight className={`h-2.5 w-2.5 shrink-0 transition-transform ${activeChapter === chapter.id ? "rotate-90 text-accent" : ""}`} />
                              <span className="line-clamp-2 flex-1">{chapter.title}</span>
                              <span className="text-[10px] text-muted-foreground/50 shrink-0">{chapter.articles.length}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-4 w-4 text-accent" />
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                  </div>

                  {section.chapters.map((chapter) => (
                    <div key={chapter.id} className="mb-8"
                      ref={(el) => { chapterRefs.current[chapter.id] = el; }}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 scroll-mt-20 pl-1">
                        {chapter.title}
                      </h3>

                      <Accordion type="multiple" className="space-y-1.5" value={openArticles} onValueChange={setOpenArticles}>
                        {chapter.articles.map((article) => (
                          <AccordionItem key={article.id} value={article.id}
                            id={`article-${article.article_number}`}
                            className={`border border-border/20 rounded-xl px-4 bg-card/20 transition-colors hover:bg-card/40 ${article.is_void ? "opacity-40" : ""}`}>
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center gap-2.5 text-left">
                                <span className="text-[11px] font-mono text-accent shrink-0">
                                  {article.article_number}
                                </span>
                                <span className="text-sm">
                                  {article.article_title}
                                  {article.is_void && <span className="text-destructive ml-1.5 text-xs">(утр. силу)</span>}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-5">
                              <div className="space-y-3">
                                <div className="flex gap-1 mb-3">
                                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(article.article_number)}
                                    className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                                    <Link2 className="h-3 w-3" />
                                    Ссылка
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(article)}
                                    className={`h-7 gap-1 text-[11px] ${isFavorite(article.article_number, favoriteType) ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                                    <Bookmark className={`h-3 w-3 ${isFavorite(article.article_number, favoriteType) ? "fill-current" : ""}`} />
                                    {isFavorite(article.article_number, favoriteType) ? "В избранном" : "В избранное"}
                                  </Button>
                                </div>

                                {article.parts.map((part) => (
                                  <div key={part.number} className="space-y-1">
                                    <p className="text-sm text-foreground/90 leading-relaxed">
                                      <span className="font-medium text-accent text-xs">ч.{part.number}</span>{" "}
                                      {part.text.replace(/^\*+|\*+$/g, "")}
                                    </p>
                                    {part.punishment && (
                                      <p className="text-xs text-denver-warning ml-5 flex items-center gap-1">
                                        ⚖️ {part.punishment}
                                      </p>
                                    )}
                                  </div>
                                ))}

                                {article.description && (
                                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground leading-relaxed">
                                    {article.description}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
