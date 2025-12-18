import { Layout } from "@/components/Layout";
import { detentionProcedure, arrestProcedure, forceStages, mirandaRights, timeLimits, detentionSubjects, immunePersons, bailTable } from "@/data/procedures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Procedures() {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Процедуры для госслужащих</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>🔒 Процедура задержания</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {detentionProcedure.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>⛓️ Процедура ареста</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {arrestProcedure.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>📢 Правило Миранды</CardTitle></CardHeader>
            <CardContent>
              <blockquote className="border-l-4 border-accent pl-4 italic text-lg">{mirandaRights}</blockquote>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>⚡ Стадии применения силы</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forceStages.map((stage) => (
                  <div key={stage.level} className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">{stage.level}</Badge>
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>⏱️ Временные ограничения</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Действие</TableHead><TableHead>Время</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {timeLimits.map((item) => (
                    <TableRow key={item.action}><TableCell>{item.action}</TableCell><TableCell>{item.time}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>💰 Таблица залогов</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Розыск</TableHead><TableHead>Сумма</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {bailTable.map((item) => (
                    <TableRow key={item.stars}><TableCell>{"⭐".repeat(item.stars)}</TableCell><TableCell className="font-semibold">{item.amount}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>👥 Субъекты задержания</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1">
                {detentionSubjects.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>🛡️ Неприкосновенные лица</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1">
                {immunePersons.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
