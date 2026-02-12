import { Layout } from "@/components/Layout";
import { crimeComposition, normStructure, guiltForms, criminalPrinciples, publicDanger, offenseTypes } from "@/data/legalTheory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CrimeCompositionDiagram } from "@/components/CrimeCompositionDiagram";
import hardyLogo from "@/assets/hardy-logo.png";

export default function LegalReference() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Юридическая справка</h1>
            <p className="text-muted-foreground text-sm">Majestic RP | <span className="text-accent font-semibold">Denver</span></p>
          </div>
        </div>

        {/* Interactive Crime Composition Diagram */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📋 {crimeComposition.title}</CardTitle>
            <p className="text-muted-foreground">{crimeComposition.description}</p>
          </CardHeader>
          <CardContent>
            <CrimeCompositionDiagram />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">

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
