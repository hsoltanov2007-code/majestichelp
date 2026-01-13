import { useState, useMemo, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { proceduralCode, ProceduralArticle } from "@/data/proceduralCode";
import { ScrollText, AlertCircle, FileText, Search, X, ChevronRight, List, BookOpen } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

interface SearchResult {
  article: ProceduralArticle;
  chapterTitle: string;
  sectionTitle: string;
  chapterId: string;
  matchType: 'title' | 'content' | 'note';
  matchText: string;
}

const ProceduralCode = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [showNavigation, setShowNavigation] = useState(true);
  const [openArticles, setOpenArticles] = useState<string[]>([]);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build flat list of all chapters for navigation
  const allChapters = useMemo(() => {
    const chapters: { id: string; title: string; sectionTitle: string; articleCount: number }[] = [];
    proceduralCode.forEach((section) => {
      section.chapters.forEach((chapter) => {
        chapters.push({
          id: chapter.id,
          title: chapter.title,
          sectionTitle: section.title,
          articleCount: chapter.articles.length
        });
      });
    });
    return chapters;
  }, []);

  // Powerful search function
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    proceduralCode.forEach((section) => {
      section.chapters.forEach((chapter) => {
        chapter.articles.forEach((article) => {
          // Search in title
          if (article.title.toLowerCase().includes(query) || article.id.toLowerCase().includes(query)) {
            results.push({
              article,
              chapterTitle: chapter.title,
              sectionTitle: section.title,
              chapterId: chapter.id,
              matchType: 'title',
              matchText: article.title
            });
            return;
          }

          // Search in parts
          for (const part of article.parts) {
            if (part.text.toLowerCase().includes(query)) {
              results.push({
                article,
                chapterTitle: chapter.title,
                sectionTitle: section.title,
                chapterId: chapter.id,
                matchType: 'content',
                matchText: part.text.substring(0, 150) + (part.text.length > 150 ? '...' : '')
              });
              return;
            }

            // Search in subparts
            if (part.subparts) {
              for (const subpart of part.subparts) {
                if (subpart.text.toLowerCase().includes(query)) {
                  results.push({
                    article,
                    chapterTitle: chapter.title,
                    sectionTitle: section.title,
                    chapterId: chapter.id,
                    matchType: 'content',
                    matchText: subpart.text.substring(0, 150) + (subpart.text.length > 150 ? '...' : '')
                  });
                  return;
                }
              }
            }
          }

          // Search in notes
          if (article.notes) {
            for (const note of article.notes) {
              if (note.toLowerCase().includes(query)) {
                results.push({
                  article,
                  chapterTitle: chapter.title,
                  sectionTitle: section.title,
                  chapterId: chapter.id,
                  matchType: 'note',
                  matchText: note.substring(0, 150) + (note.length > 150 ? '...' : '')
                });
                return;
              }
            }
          }

          // Search in exception
          if (article.exception?.toLowerCase().includes(query)) {
            results.push({
              article,
              chapterTitle: chapter.title,
              sectionTitle: section.title,
              chapterId: chapter.id,
              matchType: 'note',
              matchText: article.exception.substring(0, 150) + (article.exception.length > 150 ? '...' : '')
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery]);

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark> : part
    );
  };

  // Scroll to chapter
  const scrollToChapter = (chapterId: string) => {
    const element = chapterRefs.current[chapterId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(chapterId);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    scrollToChapter(result.chapterId);
    setOpenArticles(prev => [...prev, result.article.id]);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
            <h1 className="text-3xl font-bold">Процессуальный кодекс</h1>
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

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск по статьям, ключевым словам... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-10 pr-10 h-12 text-base bg-background/50 border-border/50 focus:border-primary"
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

          {/* Search Results Dropdown */}
          {isSearchFocused && searchQuery.length >= 2 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
              <ScrollArea className="max-h-[400px]">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ничего не найдено по запросу "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground">
                      Найдено: {searchResults.length} результат(ов)
                    </div>
                    {searchResults.slice(0, 20).map((result, idx) => (
                      <button
                        key={`${result.article.id}-${idx}`}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="font-mono shrink-0 mt-0.5">
                            Ст. {result.article.id}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {highlightText(result.article.title.replace(`Статья ${result.article.id}. `, "").replace(`Статья ${result.article.id} `, ""), searchQuery)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {highlightText(result.matchText, searchQuery)}
                            </p>
                            <p className="text-xs text-primary/70 mt-1">
                              {result.chapterTitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchResults.length > 20 && (
                      <div className="px-4 py-2 text-center text-sm text-muted-foreground bg-muted/30">
                        И ещё {searchResults.length - 20} результат(ов)...
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Click outside to close search */}
        {isSearchFocused && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsSearchFocused(false)}
          />
        )}

        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <aside className={`${showNavigation ? 'block' : 'hidden'} lg:block w-full lg:w-72 shrink-0`}>
            <div className="sticky top-4">
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
                      {proceduralCode.map((section) => (
                        <div key={section.id} className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                            {section.title.replace("Раздел ", "").split(".")[0]}
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
                                    ? 'bg-primary/20 text-primary' 
                                    : 'hover:bg-muted/50 text-foreground/80'
                                }`}
                              >
                                <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeChapter === chapter.id ? 'rotate-90' : ''}`} />
                                <span className="line-clamp-2 text-xs">
                                  {chapter.title.replace("Глава ", "").replace(/\.\s*/, ". ")}
                                </span>
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
              {proceduralCode.map((section) => (
                <Card key={section.id} className="border-border/50">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
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
                        <h3 className="text-lg font-semibold mb-4 text-primary scroll-mt-20">{chapter.title}</h3>
                        
                        {chapter.articles.length === 0 ? (
                          <p className="text-muted-foreground italic text-sm">Глава не содержит статей</p>
                        ) : (
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
                                className="border border-border/50 rounded-lg px-4"
                              >
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">
                                      Ст. {article.id}
                                    </Badge>
                                    <span className="text-left">{article.title.replace(`Статья ${article.id}. `, "").replace(`Статья ${article.id} `, "")}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pb-6">
                                  <div className="space-y-4">
                                    {article.parts.map((part) => (
                                      <div key={part.number} className="space-y-2">
                                        <p className="text-foreground">
                                          <span className="font-medium text-primary">ч. {part.number}.</span>{" "}
                                          {part.text}
                                        </p>
                                        {part.subparts && (
                                          <div className="ml-6 space-y-1">
                                            {part.subparts.map((subpart) => (
                                              <p key={subpart.letter} className="text-muted-foreground">
                                                <span className="font-medium">{subpart.letter})</span> {subpart.text}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}

                                    {article.notes && article.notes.length > 0 && (
                                      <div className="mt-4 space-y-2">
                                        {article.notes.map((note, idx) => (
                                          <div key={idx} className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-amber-200/80">
                                              <span className="font-medium">Примечание:</span> {note}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {article.exception && (
                                      <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-blue-200/80">
                                          <span className="font-medium">Исключение:</span> {article.exception}
                                        </p>
                                      </div>
                                    )}

                                    {article.comment && (
                                      <div className="flex gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <FileText className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-purple-200/80">
                                          <span className="font-medium">Комментарий:</span> {article.comment}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </div>
                    ))}

                    {section.author && (
                      <div className="mt-6 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                        <p>{section.author}</p>
                        <p>Leader Government</p>
                        <p>{section.date}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ProceduralCode;
