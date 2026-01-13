import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { allLaws, Law, LawChapter, LawArticle } from "@/data/laws";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Scale, Shield, Briefcase, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import hardyLogo from "@/assets/hardy-logo.png";

const lawIcons: Record<string, React.ReactNode> = {
  "constitution": <Scale className="w-5 h-5" />,
  "immunity-law": <Shield className="w-5 h-5" />,
  "labor-code": <Briefcase className="w-5 h-5" />,
  "law-enforcement": <Users className="w-5 h-5" />,
  "secret-service": <Shield className="w-5 h-5" />
};

function ArticleView({ article }: { article: LawArticle }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-primary">{article.title}</h4>
      <div className="space-y-2">
        {article.parts.map((part, idx) => (
          <div key={idx} className="pl-4 border-l-2 border-muted">
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">ч. {part.number}.</span>{" "}
              {part.text}
            </p>
            {part.subparts && (
              <div className="pl-4 mt-2 space-y-1">
                {part.subparts.map((sub, subIdx) => (
                  <p key={subIdx} className="text-sm text-muted-foreground">
                    <span className="font-medium">{sub.letter})</span> {sub.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {article.notes && article.notes.length > 0 && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-1">Примечание:</p>
          {article.notes.map((note, idx) => (
            <p key={idx} className="text-sm text-muted-foreground">{note}</p>
          ))}
        </div>
      )}
      {article.exception && (
        <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-xs font-medium text-yellow-600 mb-1">Исключение:</p>
          <p className="text-sm">{article.exception}</p>
        </div>
      )}
    </div>
  );
}

function ChapterView({ chapter }: { chapter: LawChapter }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {chapter.articles.map((article) => (
        <AccordionItem key={article.number} value={article.number}>
          <AccordionTrigger className="text-left hover:no-underline">
            <span className="text-sm">{article.title}</span>
          </AccordionTrigger>
          <AccordionContent>
            <ArticleView article={article} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function LawView({ law }: { law: Law }) {
  const [search, setSearch] = useState("");

  const filteredChapters = useMemo(() => {
    if (!search.trim()) return law.chapters;
    
    const query = search.toLowerCase();
    return law.chapters.map(chapter => ({
      ...chapter,
      articles: chapter.articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.parts.some(part => 
          part.text.toLowerCase().includes(query) ||
          part.subparts?.some(sub => sub.text.toLowerCase().includes(query))
        )
      )
    })).filter(chapter => chapter.articles.length > 0);
  }, [law.chapters, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {lawIcons[law.id] || <BookOpen className="w-5 h-5" />}
            {law.title}
          </h2>
          {law.description && (
            <p className="text-muted-foreground text-sm mt-1">{law.description}</p>
          )}
          {law.forumUrl && (
            <Button variant="link" className="p-0 h-auto text-xs" asChild>
              <a href={law.forumUrl} target="_blank" rel="noopener noreferrer">
                Источник на форуме <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по статьям..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredChapters.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Ничего не найдено</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {filteredChapters.map((chapter) => (
            <AccordionItem key={chapter.id} value={chapter.id}>
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {chapter.articles.length} ст.
                  </Badge>
                  <span>{chapter.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ChapterView chapter={chapter} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {law.signedBy && (
        <div className="text-xs text-muted-foreground text-right pt-4 border-t">
          Подписано Губернатором: {law.signedBy}
          {law.signedDate && ` (${law.signedDate})`}
        </div>
      )}
    </div>
  );
}

export default function Laws() {
  const [activeTab, setActiveTab] = useState(allLaws[0].id);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Нормативно-правовые акты</h1>
            <p className="text-muted-foreground">Законы и кодексы штата Сан-Андреас</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full pb-2">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 gap-1 flex-wrap">
              {allLaws.map((law) => (
                <TabsTrigger
                  key={law.id}
                  value={law.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-sm whitespace-nowrap"
                >
                  <span className="mr-2">{lawIcons[law.id] || <BookOpen className="w-4 h-4" />}</span>
                  {law.shortTitle}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {allLaws.map((law) => (
            <TabsContent key={law.id} value={law.id} className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <LawView law={law} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
