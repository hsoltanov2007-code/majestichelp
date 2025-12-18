import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Info, Shield, Search } from "lucide-react";
import { governmentRules } from "@/data/governmentRules";
import { useState } from "react";

export default function GovernmentRules() {
  const [search, setSearch] = useState("");

  const filteredSections = governmentRules.map(section => ({
    ...section,
    rules: section.rules.filter(rule =>
      rule.text.toLowerCase().includes(search.toLowerCase()) ||
      rule.id.toLowerCase().includes(search.toLowerCase()) ||
      (rule.clarification && rule.clarification.toLowerCase().includes(search.toLowerCase())) ||
      (rule.example && rule.example.toLowerCase().includes(search.toLowerCase()))
    )
  })).filter(section => section.rules.length > 0);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-bold">Правила государственных организаций</h1>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по правилам..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Accordion type="multiple" className="space-y-4" defaultValue={["general"]}>
          {filteredSections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="font-semibold text-lg">{section.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {section.rules.map((rule) => (
                    <Card key={rule.id} className="border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-base font-medium">
                            <span className="text-accent mr-2">§{rule.id}</span>
                            {rule.text}
                          </CardTitle>
                        </div>
                        {rule.punishment && (
                          <Badge variant="destructive" className="w-fit mt-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {rule.punishment}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {rule.clarification && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                            <span><strong>Пояснение:</strong> {rule.clarification}</span>
                          </div>
                        )}
                        {rule.note && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-denver-gold" />
                            <span><strong>Примечание:</strong> {rule.note}</span>
                          </div>
                        )}
                        {rule.example && (
                          <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                            <strong>Пример:</strong> {rule.example}
                          </div>
                        )}
                        {rule.exception && (
                          <div className="text-sm text-green-400/80 bg-green-500/10 p-3 rounded-md">
                            <strong>Исключение:</strong> {rule.exception}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Card className="mt-8 bg-secondary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Автор темы: appolo | Дата начала: 13.04.2020 | Последнее редактирование: 25.11.2025
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
