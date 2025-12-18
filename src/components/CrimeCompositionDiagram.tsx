import { cn } from "@/lib/utils";

interface DiagramBoxProps {
  title: string;
  required?: boolean;
  className?: string;
}

const DiagramBox = ({ title, required = false, className }: DiagramBoxProps) => (
  <div
    className={cn(
      "px-3 py-2 text-sm text-center border-2 rounded bg-card transition-all hover:scale-105",
      required ? "border-destructive text-destructive font-medium" : "border-border",
      className
    )}
  >
    {title}
  </div>
);

const ConnectorLine = ({ className }: { className?: string }) => (
  <div className={cn("bg-border", className)} />
);

export function CrimeCompositionDiagram() {
  return (
    <div className="p-6 overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Main title */}
        <div className="flex justify-center mb-4">
          <div className="px-6 py-3 text-lg font-bold border-2 border-foreground rounded bg-card">
            СОСТАВ ПРЕСТУПЛЕНИЯ
          </div>
        </div>

        {/* Connector down */}
        <div className="flex justify-center">
          <ConnectorLine className="w-0.5 h-6" />
        </div>

        {/* Two main branches */}
        <div className="flex justify-center gap-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-0.5 bg-border" />
          
          {/* Left branch - Объективные признаки */}
          <div className="flex flex-col items-center">
            <ConnectorLine className="w-0.5 h-4" />
            <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-4">
              Объективные признаки
            </div>
            
            <div className="flex gap-8">
              {/* ОБЪЕКТ */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-3">
                  ОБЪЕКТ
                </div>
                <div className="space-y-2">
                  <DiagramBox title="предмет" />
                  <DiagramBox title="потерпевший" />
                </div>
              </div>

              {/* ОБЪЕКТИВНАЯ СТОРОНА */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-3">
                  ОБЪЕКТИВНАЯ СТОРОНА
                </div>
                <div className="space-y-2">
                  <DiagramBox title="деяние" required />
                  <DiagramBox title="последствия" />
                  <DiagramBox title="причинная связь" />
                  <div className="flex gap-2">
                    <DiagramBox title="время" />
                    <DiagramBox title="место" />
                  </div>
                  <DiagramBox title="способ" />
                  <DiagramBox title="орудия и средства" />
                  <DiagramBox title="обстановка" />
                </div>
              </div>
            </div>
          </div>

          {/* Plus sign */}
          <div className="flex items-start pt-8">
            <span className="text-2xl font-bold text-muted-foreground">+</span>
          </div>

          {/* Right branch - Субъективные признаки */}
          <div className="flex flex-col items-center">
            <ConnectorLine className="w-0.5 h-4" />
            <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-4">
              Субъективные признаки
            </div>
            
            <div className="flex gap-8">
              {/* СУБЪЕКТ */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-3">
                  СУБЪЕКТ
                </div>
                <div className="space-y-2">
                  <DiagramBox title="возраст" required />
                  <DiagramBox title="вменяемость" required />
                  <DiagramBox title="физическое лицо" required />
                  <DiagramBox title="специальные признаки" />
                </div>
              </div>

              {/* СУБЪЕКТИВНАЯ СТОРОНА */}
              <div className="flex flex-col items-center">
                <div className="px-4 py-2 font-semibold border-2 border-foreground rounded bg-card mb-3">
                  СУБЪЕКТИВНАЯ СТОРОНА
                </div>
                <div className="space-y-2">
                  <DiagramBox title="вина" required />
                  <DiagramBox title="мотив" />
                  <DiagramBox title="цель" />
                  <DiagramBox title="эмоции" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end gap-6 mt-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-destructive rounded" />
            <span>Обязательные признаки</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-border rounded" />
            <span>Факультативные признаки</span>
          </div>
        </div>
      </div>
    </div>
  );
}
