import { Layout } from "@/components/Layout";
import { crimeComposition, normStructure, guiltForms, criminalPrinciples, publicDanger, offenseTypes } from "@/data/legalTheory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function LegalReference() {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Юридическая справка</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>📋 {crimeComposition.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{crimeComposition.description}</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Объективные признаки:</h4>
                  {crimeComposition.objectiveSigns.map((s) => (
                    <div key={s.name} className="mb-2">
                      <Badge className="mr-2">{s.name}</Badge>
                      <span className="text-sm">{s.description}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Субъективные признаки:</h4>
                  {crimeComposition.subjectiveSigns.map((s) => (
                    <div key={s.name} className="mb-2">
                      <Badge className="mr-2">{s.name}</Badge>
                      <span className="text-sm">{s.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>📜 {normStructure.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {normStructure.elements.map((e) => (
                  <div key={e.name}>
                    <h4 className="font-semibold">{e.name}</h4>
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>⚖️ {guiltForms.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-lg mb-4">{guiltForms.intent.name}</h4>
                  {guiltForms.intent.types.map((t) => (
                    <div key={t.name} className="mb-4">
                      <Badge variant="destructive" className="mb-2">{t.name}</Badge>
                      <p className="text-sm">{t.description}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-4">{guiltForms.negligence.name}</h4>
                  {guiltForms.negligence.types.map((t) => (
                    <div key={t.name} className="mb-4">
                      <Badge variant="secondary" className="mb-2">{t.name}</Badge>
                      <p className="text-sm">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>📚 Принципы уголовного права</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {criminalPrinciples.map((p, i) => (
                  <AccordionItem key={i} value={`p-${i}`}>
                    <AccordionTrigger>{p.name}</AccordionTrigger>
                    <AccordionContent>{p.description}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>⚠️ {publicDanger.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{publicDanger.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>📂 {offenseTypes.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {offenseTypes.types.map((t) => (
                  <div key={t.name}>
                    <h4 className="font-medium">{t.name}</h4>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
