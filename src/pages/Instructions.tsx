import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Instructions() {
  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Инструкции</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle>🔍 Как пользоваться порталом</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Используйте навигацию вверху для перехода между разделами</li>
              <li>На страницах кодексов используйте поиск и фильтры</li>
              <li>Нажмите <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+F</kbd> для поиска на странице</li>
              <li>Переключайте тему (светлая/тёмная) кнопкой в шапке</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>📖 Обозначения</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="fr">
                <AccordionTrigger>(F/R) — Felony/Registry</AccordionTrigger>
                <AccordionContent>Тяжкое преступление, заносится в реестр</AccordionContent>
              </AccordionItem>
              <AccordionItem value="stars">
                <AccordionTrigger>⭐ — Уровень розыска</AccordionTrigger>
                <AccordionContent>От 1 до 5 звёзд. Чем больше звёзд, тем серьёзнее преступление и выше залог.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="court">
                <AccordionTrigger>✔️/❌ — Требуется ли суд</AccordionTrigger>
                <AccordionContent>✔️ означает обязательное судебное разбирательство, ❌ — дело решается без суда.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="ak">
                <AccordionTrigger>АК — Административный кодекс</AccordionTrigger>
                <AccordionContent>Менее серьёзные правонарушения, наказываются только штрафами.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🔗 Полезные ссылки</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="https://discord.gg/majestic" target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
                Discord Majestic RP
              </a>
              <a href="https://discord.gg/statemajestic" target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
                Discord State Fraction
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
