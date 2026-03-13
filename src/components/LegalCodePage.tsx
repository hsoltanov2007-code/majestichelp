import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, ChevronRight, List, BookOpen, FileText, AlertCircle, Bookmark, Link2, Printer } from "lucide-react";
import { useLegalArticles, LegalArticle } from "@/hooks/useLegalArticles";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import hardyLogo from "@/assets/hardy-logo.png";

interface LegalCodePageProps {
  sourceShortName: string;
  title: string;
  favoriteType: string;
  icon?: string;
  basePath: string;
}

export function LegalCodePage({ sourceShortName, title, favoriteType, icon = "📜", basePath }: LegalCodePageProps) {
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

  // Group articles by section → chapter
  const sections = useMemo(() => {
    const sectionMap = new Map<string, Map<string, LegalArticle[]>>();
    
    articles.forEach((article) => {
      const sectionKey = article.section_name || "Общие положения";
      const chapterKey = article.chapter_name || "Основные статьи";
      
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, new Map());
      }
      const chapters = sectionMap.get(sectionKey)!;
      if (!chapters.has(chapterKey)) {
        chapters.set(chapterKey, []);
      }
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

  // Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return articles.filter((a) =>
      a.article_number.toLowerCase().includes(query) ||
      a.article_title.toLowerCase().includes(query) ||
      a.parts.some((p) => p.text.toLowerCase().includes(query)) ||
      (a.description && a.description.toLowerCase().includes(query))
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
    toggleFavorite({
      id: article.article_number,
      type: favoriteType,
      article: `Ст. ${article.article_number}`,
      description: article.article_title,
    });
    toast({
      title: wasFav ? "Удалено из избранного" : "Добавлено в избранное",
      description: `Ст. ${article.article_number}`,
    });
  };

  const handleCopyLink = (articleNumber: string) => {
    const url = `${window.location.origin}${basePath}?article=${articleNumber}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована" });
  };

  // Scroll to article from URL
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
            el.classList.add("ring-2", "ring-accent");
            setTimeout(() => el.classList.remove("ring-2", "ring-accent"), 2000);
          }
        }, 300);
      }
    }
  }, [searchParams, isLoading, articles]);

  // Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-8">
            <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground">Загрузка статей...</p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-8">
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-3 py-8">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p>Ошибка загрузки: {error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 opacity-0 animate-fade-up">
          <div className="flex items-center gap-3">
            <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground text-sm">
                Majestic RP | <span className="text-accent font-semibold">Denver</span> · Всего статей: {totalCount}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNavigation(!showNavigation)}
            className="lg:hidden"
          >
            <List className="h-4 w-4 mr-2" />
            Главы
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 opacity-0 animate-fade-up stagger-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Поиск по статьям... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base bg-background/50 border-border/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchQuery.length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
              <ScrollArea className="max-h-[400px]">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ничего не найдено</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground">
                      Найдено: {searchResults.length}
                    </div>
                    {searchResults.map((article) => (
                      <button
                        key={article.id}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setOpenArticles((prev) => [...prev, article.id]);
                          setSearchQuery("");
                          // Find chapter and scroll
                          const chapterId = (article.chapter_name || "Основные статьи").replace(/\s+/g, "-").toLowerCase();
                          scrollToChapter(chapterId);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="font-mono shrink-0 mt-0.5">
                            Ст. {article.article_number}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{article.article_title}</p>
                            {article.parts[0] && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {article.parts[0].text.substring(0, 120)}...
                              </p>
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

        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <aside className={`${showNavigation ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0`}>
            <div className="sticky top-20">
              <Card className="border-border/50">
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Содержание
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="p-2">
                      {sections.map((section) => (
                        <div key={section.id} className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                            {section.title}
                          </p>
                          <div className="space-y-0.5">
                            {section.chapters.map((chapter) => (
                              <button
                                key={chapter.id}
                                onClick={() => {
                                  scrollToChapter(chapter.id);
                                  setShowNavigation(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                                  activeChapter === chapter.id
                                    ? "bg-accent/20 text-accent"
                                    : "hover:bg-muted/50 text-foreground/80"
                                }`}
                              >
                                <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeChapter === chapter.id ? "rotate-90" : ""}`} />
                                <span className="line-clamp-2 text-xs">{chapter.title}</span>
                                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">
                                  {chapter.articles.length}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-8">
              {sections.map((section) => (
                <Card key={section.id} className="border-border/50">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {section.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="mb-6"
                        ref={(el) => { chapterRefs.current[chapter.id] = el; }}
                      >
                        <h3 className="text-lg font-semibold mb-4 text-accent scroll-mt-20">
                          {chapter.title}
                        </h3>

                        <Accordion
                          type="multiple"
                          className="space-y-2"
                          value={openArticles}
                          onValueChange={setOpenArticles}
                        >
                          {chapter.articles.map((article) => (
                            <AccordionItem
                              key={article.id}
                              value={article.id}
                              id={`article-${article.article_number}`}
                              className={`border border-border/50 rounded-lg px-4 ${article.is_void ? "opacity-50" : ""}`}
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2 text-left">
                                  <Badge variant="outline" className="font-mono shrink-0">
                                    Ст. {article.article_number}
                                  </Badge>
                                  <span className="text-sm">
                                    {article.article_title}
                                    {article.is_void && <span className="text-destructive ml-2">(утратила силу)</span>}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 pb-6">
                                <div className="space-y-3">
                                  {/* Action buttons */}
                                  <div className="flex gap-1 mb-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyLink(article.article_number)}
                                      className="h-8 gap-1 text-xs"
                                    >
                                      <Link2 className="h-3.5 w-3.5" />
                                      Ссылка
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleFavorite(article)}
                                      className={`h-8 gap-1 text-xs ${isFavorite(article.article_number, favoriteType) ? "text-accent" : ""}`}
                                    >
                                      <Bookmark className={`h-3.5 w-3.5 ${isFavorite(article.article_number, favoriteType) ? "fill-current" : ""}`} />
                                      {isFavorite(article.article_number, favoriteType) ? "В избранном" : "В избранное"}
                                    </Button>
                                  </div>

                                  {/* Parts */}
                                  {article.parts.map((part) => (
                                    <div key={part.number} className="space-y-1">
                                      <p className="text-foreground">
                                        <span className="font-medium text-accent">ч. {part.number}.</span>{" "}
                                        {part.text.replace(/^\*+|\*+$/g, "")}
                                      </p>
                                      {part.punishment && (
                                        <p className="text-sm text-orange-400 ml-6 flex items-center gap-1">
                                          ⚖️ {part.punishment}
                                        </p>
                                      )}
                                    </div>
                                  ))}

                                  {/* Description if any */}
                                  {article.description && (
                                    <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
