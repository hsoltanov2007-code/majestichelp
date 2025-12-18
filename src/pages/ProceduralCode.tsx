import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { proceduralCode } from "@/data/proceduralCode";
import { ScrollText, AlertCircle, FileText } from "lucide-react";

const ProceduralCode = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <ScrollText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Процессуальный кодекс</h1>
        </div>

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
                  <div key={chapter.id} className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-primary">{chapter.title}</h3>
                    
                    <Accordion type="multiple" className="space-y-2">
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
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
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
      </div>
    </Layout>
  );
};

export default ProceduralCode;
