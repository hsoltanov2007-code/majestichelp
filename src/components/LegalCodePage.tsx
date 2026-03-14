import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, ChevronRight, BookOpen, FileText, AlertCircle, Bookmark, Link2, Hash, Scale } from "lucide-react";
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
  const [showNavigation, setShowNavigation] = useState(false);
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
        <div className="container py-16">
          <div className="mb-10">
            <Skeleton className="h-10 w-64 rounded-xl mb-3" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mb-8" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="glass rounded-2xl p-8 flex items-center gap-4 border-destructive/20">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium">Ошибка загрузки</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 lg:py-12">
        {/* Hero Header */}
        <div className="relative mb-10 opacity-0 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-[52px]">
                <span className="text-xs text-muted-foreground">Denver</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-xs font-mono text-accent">{totalCount} статей</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNavigation(!showNavigation)}
              className="lg:hidden h-9 text-xs gap-2 rounded-xl border-border/30 bg-card/50"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Оглавление
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10 opacity-0 animate-fade-up stagger-1">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity -m-1" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input
              ref={searchInputRef}
              placeholder="Поиск статей, номеров, текста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-20 h-12 text-sm bg-card/50 border-border/20 rounded-2xl focus:border-accent/30 focus:ring-accent/10 placeholder:text-muted-foreground/40"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setSearchQuery("")}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-border/30 bg-secondary/50 px-2 font-mono text-[10px] text-muted-foreground/60">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 glass rounded-2xl shadow-2xl shadow-background/60 overflow-hidden">
              <ScrollArea className="max-h-[400px]">
                {searchResults.length === 0 ? (
                  <div className="p-10 text-center">
                    <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">Ничего не найдено</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Попробуйте другой запрос</p>
                  </div>
                ) : (
                  <div>
                    <div className="px-5 py-3 border-b border-border/10">
                      <span className="text-[11px] text-muted-foreground">
                        Найдено <span className="text-accent font-medium">{searchResults.length}</span> статей
                      </span>
                    </div>
                    {searchResults.map((article) => (
                      <button key={article.id}
                        className="w-full text-left px-5 py-3.5 hover:bg-accent/5 transition-all border-b border-border/5 last:border-0 group/item"
                        onClick={() => {
                          setOpenArticles((prev) => [...prev, article.id]);
                          setSearchQuery("");
                          scrollToChapter((article.chapter_name || "Основные статьи").replace(/\s+/g, "-").toLowerCase());
                        }}>
                        <div className="flex items-start gap-3">
                          <span className="inline-flex items-center justify-center h-7 min-w-[2.5rem] rounded-lg bg-accent/10 text-[11px] font-mono text-accent shrink-0 mt-0.5 px-1.5">
                            {article.article_number}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium group-hover/item:text-accent transition-colors">{article.article_title}</p>
                            {article.parts[0] && (
                              <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{article.parts[0].text.substring(0, 120)}</p>
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

        <div className="flex gap-8 opacity-0 animate-fade-up stagger-2">
          {/* Sidebar Navigation */}
          <aside className={`${showNavigation ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0`}>
            <div className="sticky top-20">
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border/10">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    Оглавление
                  </h3>
                </div>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="p-3">
                    {sections.map((section, si) => (
                      <div key={section.id} className={si > 0 ? "mt-5" : ""}>
                        <p className="text-[10px] font-bold text-muted-foreground/40 px-3 py-2 uppercase tracking-[0.15em]">
                          {section.title}
                        </p>
                        <div className="space-y-0.5">
                          {section.chapters.map((chapter) => (
                            <button key={chapter.id}
                              onClick={() => { scrollToChapter(chapter.id); setShowNavigation(false); }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 group/nav ${
                                activeChapter === chapter.id
                                  ? "text-accent bg-accent/8 font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                              }`}>
                              <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeChapter === chapter.id ? "rotate-90 text-accent" : "text-muted-foreground/30 group-hover/nav:text-muted-foreground/60"}`} />
                              <span className="line-clamp-2 flex-1 leading-relaxed">{chapter.title}</span>
                              <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0">{chapter.articles.length}</span>
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
            <div className="space-y-12">
              {sections.map((section) => (
                <div key={section.id}>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-accent" />
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                    <div className="flex-1 h-px bg-border/10 ml-2" />
                  </div>

                  {section.chapters.map((chapter) => (
                    <div key={chapter.id} className="mb-10"
                      ref={(el) => { chapterRefs.current[chapter.id] = el; }}>
                      
                      {/* Chapter Header */}
                      <div className="flex items-center gap-2.5 mb-4 scroll-mt-20 pl-1">
                        <Hash className="h-3.5 w-3.5 text-accent/40" />
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          {chapter.title}
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground/30 ml-1">({chapter.articles.length})</span>
                      </div>

                      <Accordion type="multiple" className="space-y-3" value={openArticles} onValueChange={setOpenArticles}>
                        {chapter.articles.map((article) => (
                          <AccordionItem key={article.id} value={article.id}
                            id={`article-${article.article_number}`}
                            className={`relative border-0 rounded-2xl px-0 overflow-hidden transition-all group/article ${article.is_void ? "opacity-35" : ""}`}>
                            {/* Card background with left accent border */}
                            <div className="absolute inset-0 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/10 group-hover/article:border-accent/20 group-hover/article:bg-card/60 transition-all duration-300" />
                            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-accent/20 group-hover/article:bg-accent/50 transition-colors duration-300" />
                            
                            <AccordionTrigger className="relative hover:no-underline py-4 px-5 pl-6">
                              <div className="flex items-center gap-3.5 text-left w-full">
                                <div className="relative">
                                  <span className="inline-flex items-center justify-center h-9 min-w-[3rem] rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 text-[12px] font-mono text-accent shrink-0 font-bold px-2.5 shadow-sm shadow-accent/5 group-hover/article:from-accent/20 group-hover/article:to-accent/10 group-hover/article:shadow-accent/10 transition-all duration-300">
                                    {article.article_number}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium leading-snug group-hover/article:text-foreground transition-colors">
                                    {article.article_title}
                                  </span>
                                  {article.is_void && (
                                    <span className="ml-2 text-[10px] text-destructive/70 bg-destructive/8 px-2 py-0.5 rounded-full font-medium border border-destructive/10">
                                      утр. силу
                                    </span>
                                  )}
                                  {article.parts.length > 0 && (
                                    <p className="text-[11px] text-muted-foreground/40 mt-1 line-clamp-1 font-normal">
                                      {article.parts[0].text.substring(0, 80)}...
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground/25 shrink-0 mr-2">
                                  {article.parts.length} ч.
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="relative pt-0 pb-5 px-5 pl-6">
                              <div className="space-y-4">
                                {/* Action Buttons */}
                                <div className="flex gap-1.5 pb-3 border-b border-border/8">
                                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(article.article_number)}
                                    className="h-8 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary/50">
                                    <Link2 className="h-3.5 w-3.5" />
                                    Скопировать
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(article)}
                                    className={`h-8 gap-1.5 text-[11px] rounded-xl ${isFavorite(article.article_number, favoriteType) ? "text-accent bg-accent/8 hover:bg-accent/12" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                                    <Bookmark className={`h-3.5 w-3.5 ${isFavorite(article.article_number, favoriteType) ? "fill-current" : ""}`} />
                                    {isFavorite(article.article_number, favoriteType) ? "В избранном" : "В избранное"}
                                  </Button>
                                </div>

                                {/* Article Parts */}
                                {article.parts.map((part) => (
                                  <div key={part.number} className="group/part">
                                    <div className="flex gap-3">
                                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-accent/8 text-[10px] font-mono text-accent/60 shrink-0 mt-0.5 font-bold border border-accent/10">
                                        {part.number}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground/80 leading-[1.75]">
                                          {part.text.replace(/^\*+|\*+$/g, "")}
                                        </p>
                                        {part.punishment && (
                                          <div className="mt-2.5 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-denver-warning/5 border border-denver-warning/10">
                                            <span className="text-denver-warning shrink-0 text-sm leading-relaxed">⭐</span>
                                            <p className="text-xs text-denver-warning/90 leading-relaxed">{part.punishment}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Description */}
                                {article.description && (
                                  <div className="mt-3 p-4 bg-secondary/15 rounded-xl border border-border/8">
                                    <p className="text-xs text-muted-foreground/70 leading-relaxed italic">{article.description}</p>
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
