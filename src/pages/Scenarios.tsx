import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  Car,
  Users,
  ShoppingBag,
  Siren,
  Shield,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Scenario {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: string[];
  articles: { code: string; name: string }[];
  tips: string[];
}

const scenarios: Scenario[] = [
  {
    id: "traffic-stop",
    title: "Остановка транспортного средства",
    icon: <Car className="h-5 w-5" />,
    description: "Порядок действий при остановке автомобиля для проверки",
    steps: [
      "Включить проблесковые маячки и дать сигнал к остановке",
      "Дождаться полной остановки Т/С",
      "Подойти к водительскому окну, представиться",
      "Запросить документы: водительское удостоверение, страховку",
      "Проверить документы по базе данных",
      "При обнаружении нарушений — выписать штраф или провести задержание",
      "Вернуть документы, пожелать счастливого пути"
    ],
    articles: [
      { code: "1.0 ДК", name: "Предоставление лицензий" },
      { code: "2.0 ДК", name: "Требование покинуть Т/С" },
      { code: "9.0 ДК", name: "Безрассудное вождение" }
    ],
    tips: [
      "Всегда стойте за задней стойкой двери водителя",
      "Держите руку на кобуре при подозрительном поведении",
      "Вызовите подкрепление если в машине несколько человек"
    ]
  },
  {
    id: "fight",
    title: "Драка на улице",
    icon: <Users className="h-5 w-5" />,
    description: "Действия при обнаружении драки между гражданами",
    steps: [
      "Вызвать подкрепление, оценить ситуацию",
      "Громко приказать прекратить драку",
      "Разделить участников, при необходимости применить спецсредства",
      "Зафиксировать показания свидетелей",
      "Осмотреть участников на наличие травм",
      "При необходимости вызвать EMS",
      "Определить зачинщика и квалифицировать правонарушение",
      "Оформить задержание или выписать штраф"
    ],
    articles: [
      { code: "2.1 АК", name: "Мелкое хулиганство" },
      { code: "2.5 АК", name: "Нанесение побоев (без вреда здоровью)" },
      { code: "6.1 ч.1 УК", name: "Побои лёгкой/средней тяжести" }
    ],
    tips: [
      "Не вступайте в драку без подкрепления",
      "Снимайте всё на нагрудную камеру",
      "При наличии оружия — немедленно вызывайте SWAT"
    ]
  },
  {
    id: "robbery",
    title: "Ограбление магазина",
    icon: <ShoppingBag className="h-5 w-5" />,
    description: "Реагирование на вызов об ограблении торговой точки",
    steps: [
      "Подтвердить вызов, запросить подкрепление",
      "Оцепить периметр, эвакуировать гражданских",
      "Установить переговоры с преступником",
      "При захвате заложников — вызвать переговорщика",
      "При возможности — провести штурм",
      "Задержать подозреваемого, оказать первую помощь пострадавшим",
      "Зафиксировать улики, опросить свидетелей"
    ],
    articles: [
      { code: "10.4 УК", name: "Разбой" },
      { code: "7.1 ч.1 УК", name: "Похищение человека (при заложниках)" },
      { code: "12.8 ч.2 УК", name: "Незаконное ношение оружия" }
    ],
    tips: [
      "Приоритет — безопасность заложников",
      "Не преследуйте в одиночку",
      "Запоминайте приметы для ориентировки"
    ]
  },
  {
    id: "pursuit",
    title: "Погоня за нарушителем",
    icon: <Siren className="h-5 w-5" />,
    description: "Преследование скрывающегося транспортного средства",
    steps: [
      "Включить сирену и проблесковые маячки",
      "Сообщить диспетчеру направление движения",
      "Запросить воздушную поддержку (при наличии)",
      "Соблюдать безопасную дистанцию",
      "При возможности — применить PIT-манёвр или шипы",
      "После остановки — держать оружие наготове",
      "Провести задержание по протоколу высокого риска"
    ],
    articles: [
      { code: "10.5 УК", name: "Угон Т/С" },
      { code: "9.0 ДК", name: "Безрассудное вождение" },
      { code: "26.0 ДК", name: "Движение по встречной" }
    ],
    tips: [
      "Не превышайте разумную скорость погони",
      "В жилых районах прекратите погоню и передайте вертолёту",
      "Фиксируйте номер и описание Т/С"
    ]
  },
  {
    id: "search",
    title: "Обыск подозреваемого",
    icon: <Shield className="h-5 w-5" />,
    description: "Проведение личного досмотра задержанного",
    steps: [
      "Приказать подозреваемому повернуться спиной, руки за голову",
      "Надеть наручники",
      "Провести поверхностный обыск (оружие, опасные предметы)",
      "Изъять обнаруженные предметы",
      "Зачитать права Миранды",
      "При обнаружении запрещённых предметов — составить протокол",
      "Доставить в КПЗ для полного обыска"
    ],
    articles: [
      { code: "12.8 ч.2 УК", name: "Незаконное ношение оружия" },
      { code: "8.1 АК", name: "Хранение наркотиков (до 3г)" },
      { code: "13.2 УК", name: "Хранение наркотиков (от 3г)" }
    ],
    tips: [
      "Всегда надевайте перчатки",
      "Обыскивайте тщательно — карманы, пояс, обувь",
      "При обыске женщин вызывайте сотрудницу"
    ]
  },
  {
    id: "domestic",
    title: "Семейный конфликт",
    icon: <AlertTriangle className="h-5 w-5" />,
    description: "Выезд на вызов о домашнем насилии или ссоре",
    steps: [
      "Прибыть на место с напарником",
      "Разделить конфликтующих по разным комнатам",
      "Опросить каждого отдельно",
      "Осмотреть участников на наличие травм",
      "Зафиксировать показания и улики",
      "При наличии травм — вызвать EMS и задержать агрессора",
      "Предложить пострадавшему защитный ордер"
    ],
    articles: [
      { code: "2.5 АК", name: "Побои без вреда здоровью" },
      { code: "6.1 ч.1 УК", name: "Побои лёгкой/средней тяжести" },
      { code: "6.6 УК", name: "Угроза убийством" }
    ],
    tips: [
      "Домашние вызовы — одни из самых опасных",
      "Не поворачивайтесь спиной к участникам",
      "Документируйте все травмы фотографиями"
    ]
  }
];

export default function Scenarios() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Siren className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Быстрые сценарии</h1>
            <p className="text-muted-foreground">
              Готовые инструкции для типичных ситуаций
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск сценариев..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredScenarios.map((scenario) => (
            <Card key={scenario.id}>
              <Accordion type="single" collapsible>
                <AccordionItem value={scenario.id} className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {scenario.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{scenario.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-6">
                      {/* Steps */}
                      <div>
                        <h4 className="font-semibold mb-3">Порядок действий:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {scenario.steps.map((step, i) => (
                            <li key={i} className="text-muted-foreground">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Articles */}
                      <div>
                        <h4 className="font-semibold mb-3">
                          Применимые статьи:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {scenario.articles.map((article) => (
                            <Badge key={article.code} variant="secondary">
                              {article.code} — {article.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Tips */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Советы:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {scenario.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
