import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { 
  Shield, AlertTriangle, Car, Search, FileText, Scale, 
  Users, Handshake, ArrowRight, BookOpen, CheckCircle2, 
  XCircle, Star, Siren, Ban, Eye, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Ситуационные гайды
const situationGuides = [
  {
    id: "traffic-stop",
    icon: Car,
    title: "Остановка транспортного средства",
    color: "text-yellow-500",
    steps: [
      "Включите спецсигналы и дайте команду остановиться",
      "Подойдите к ТС со стороны водителя",
      "Представьтесь: звание, имя, фамилия, подразделение",
      "Попросите документы (ID, права, лицензии)",
      "Сообщите причину остановки",
      "При нарушении — выпишите штраф (АК) или задержите (УК)",
    ],
    tips: ["Если водитель убегает — ст. 10.3 УК (уклонение от задержания)", "Если нет прав — ст. 3.1 АК (штраф $5,000–$10,000)"],
  },
  {
    id: "detention",
    icon: Lock,
    title: "Задержание подозреваемого",
    color: "text-destructive",
    steps: [
      "Объявите задержание: 'Вы задержаны по подозрению в...'",
      "Зачитайте права Миранды (право на молчание, право на адвоката)",
      "Наденьте наручники и проведите досмотр",
      "Доставьте в отдел для оформления",
      "Составьте рапорт и определите статью",
      "Передайте дело следователю или оформите самостоятельно",
    ],
    tips: ["Без прав Миранды — задержание незаконно!", "Максимальное время задержания без обвинения — 30 минут"],
  },
  {
    id: "search",
    icon: Search,
    title: "Обыск и досмотр",
    color: "text-primary",
    steps: [
      "Личный досмотр — при задержании, без ордера",
      "Досмотр ТС — при задержании водителя или наличии оснований",
      "Обыск дома/бизнеса — ТОЛЬКО по ордеру судьи",
      "Зафиксируйте все изъятые предметы",
      "Составьте протокол досмотра/обыска",
    ],
    tips: ["Обыск без ордера = нарушение ПК, улики будут недопустимыми", "Досмотр ≠ обыск: досмотр — при задержании, обыск — по ордеру"],
  },
  {
    id: "pursuit",
    icon: Siren,
    title: "Погоня",
    color: "text-orange-500",
    steps: [
      "Включите спецсигналы и сирену",
      "Сообщите по рации: направление, ТС, причина",
      "Соблюдайте безопасность — не подвергайте гражданских опасности",
      "При необходимости — запросите подкрепление",
      "После остановки — задержите по соответствующей статье",
      "Ст. 10.3 УК — уклонение от задержания (⭐⭐⭐)",
    ],
    tips: ["Стрельба по колёсам — только с разрешения командира", "Если подозреваемый бросил ТС — продолжайте пешую погоню"],
  },
  {
    id: "robbery",
    icon: AlertTriangle,
    title: "Ограбление / Захват",
    color: "text-destructive",
    steps: [
      "Оцепите территорию и обеспечьте безопасность гражданских",
      "Запросите переговорщика при захвате заложников",
      "Не входите в здание без приказа командира",
      "Фиксируйте всех подозреваемых и их приметы",
      "После задержания — оформите по ст. 8.1-8.4 УК",
    ],
    tips: ["Ограбление магазина — ст. 8.1 УК (⭐⭐)", "Ограбление банка — ст. 8.4 УК (⭐⭐⭐⭐⭐)"],
  },
];

// Топ частых статей для новичков
const topCriminalArticles = [
  { article: "6.1", desc: "Нанесение тяжких телесных", stars: 3, icon: "🩸" },
  { article: "6.2", desc: "Убийство", stars: 4, icon: "💀" },
  { article: "7.1", desc: "Похищение человека", stars: 4, icon: "🔗" },
  { article: "8.1", desc: "Кража / Грабёж", stars: 2, icon: "💰" },
  { article: "8.4", desc: "Разбой", stars: 5, icon: "🔫" },
  { article: "9.1", desc: "Незаконное хранение оружия", stars: 2, icon: "🔫" },
  { article: "10.1", desc: "Нападение на сотрудника", stars: 3, icon: "👮" },
  { article: "10.3", desc: "Уклонение от задержания", stars: 3, icon: "🏃" },
  { article: "11.1", desc: "Наркотики (хранение)", stars: 2, icon: "💊" },
  { article: "12.1", desc: "Мошенничество", stars: 2, icon: "🎭" },
];

const topAdminArticles = [
  { article: "1.1", desc: "Нарушение общественного порядка", fine: "$3,000–$7,000", icon: "📢" },
  { article: "1.2", desc: "Неповиновение сотруднику", fine: "$5,000–$15,000", icon: "🚫" },
  { article: "2.1", desc: "Нарушение ПДД", fine: "$3,000–$5,000", icon: "🚗" },
  { article: "3.1", desc: "Управление без прав", fine: "$5,000–$10,000", icon: "📄" },
  { article: "4.1", desc: "Нарушение правил парковки", fine: "$1,000–$3,000", icon: "🅿️" },
];

// Важные обозначения
const notations = [
  { symbol: "⭐", label: "Уровень розыска", desc: "от 1 до 5 звёзд — чем больше, тем серьёзнее" },
  { symbol: "F/R", label: "Felony/Registry", desc: "Тяжкое преступление, заносится в реестр судимостей" },
  { symbol: "✔️", label: "Суд обязателен", desc: "Требуется судебное разбирательство" },
  { symbol: "❌", label: "Без суда", desc: "Решается административно, без суда" },
  { symbol: "УК", label: "Уголовный кодекс", desc: "Серьёзные преступления — лишение свободы" },
  { symbol: "АК", label: "Административный кодекс", desc: "Правонарушения — только штрафы" },
  { symbol: "ДК", label: "Дорожный кодекс", desc: "Нарушения ПДД" },
  { symbol: "ПК", label: "Процессуальный кодекс", desc: "Правила и процедуры для сотрудников" },
];

function StarsDisplay({ count }: { count: number }) {
  return (
    <span className="text-yellow-500 text-xs">
      {"⭐".repeat(count)}
    </span>
  );
}

export default function BeginnerGuide() {
  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Памятка для новичков
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Гайд для <span className="text-primary">госслужащих</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Всё что нужно знать новому сотруднику: ситуационные инструкции, 
            частые статьи и обозначения кодексов
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <a href="#situations" className="inline-flex items-center gap-1.5 rounded-full bg-card/60 border border-border/50 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <Siren className="h-3.5 w-3.5" /> Ситуации
          </a>
          <a href="#top-articles" className="inline-flex items-center gap-1.5 rounded-full bg-card/60 border border-border/50 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <Scale className="h-3.5 w-3.5" /> Топ статей
          </a>
          <a href="#notations" className="inline-flex items-center gap-1.5 rounded-full bg-card/60 border border-border/50 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <BookOpen className="h-3.5 w-3.5" /> Обозначения
          </a>
          <a href="#dos-donts" className="inline-flex items-center gap-1.5 rounded-full bg-card/60 border border-border/50 px-4 py-2 text-sm hover:bg-accent transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" /> Что можно / нельзя
          </a>
        </div>

        {/* SECTION 1: Situation Guides */}
        <section id="situations" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Siren className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Ситуационные гайды</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {situationGuides.map((guide) => (
              <Card key={guide.id} className="bg-card/40 backdrop-blur border-border/50 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <guide.icon className={`h-5 w-5 ${guide.color}`} />
                    {guide.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-1.5 mb-4">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary font-bold shrink-0 w-5">{i + 1}.</span>
                        <span className="text-foreground/90">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {guide.tips.length > 0 && (
                    <div className="border-t border-border/30 pt-3 space-y-1">
                      {guide.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-yellow-500">💡</span> {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 2: Top Articles */}
        <section id="top-articles" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="h-5 w-5 text-destructive" />
            <h2 className="text-2xl font-bold">Топ частых статей</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Criminal */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="destructive" className="text-xs">УК</Badge>
                <span className="text-sm font-medium text-muted-foreground">Уголовный кодекс</span>
              </div>
              <div className="space-y-1.5">
                {topCriminalArticles.map((a) => (
                  <Link
                    key={a.article}
                    to={`/criminal-code?article=${a.article}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card/30 hover:bg-card/60 border border-transparent hover:border-border/50 transition-all group"
                  >
                    <span className="text-lg w-7 text-center">{a.icon}</span>
                    <span className="font-mono text-sm font-semibold text-destructive w-10">{a.article}</span>
                    <span className="flex-1 text-sm text-foreground/90">{a.desc}</span>
                    <StarsDisplay count={a.stars} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Administrative */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/20 text-primary text-xs hover:bg-primary/30">АК</Badge>
                <span className="text-sm font-medium text-muted-foreground">Административный кодекс</span>
              </div>
              <div className="space-y-1.5">
                {topAdminArticles.map((a) => (
                  <Link
                    key={a.article}
                    to={`/administrative-code?article=${a.article}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card/30 hover:bg-card/60 border border-transparent hover:border-border/50 transition-all group"
                  >
                    <span className="text-lg w-7 text-center">{a.icon}</span>
                    <span className="font-mono text-sm font-semibold text-primary w-10">{a.article}</span>
                    <span className="flex-1 text-sm text-foreground/90">{a.desc}</span>
                    <span className="text-xs text-muted-foreground">{a.fine}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 justify-center">
            <Link to="/criminal-code" className="text-sm text-primary hover:underline flex items-center gap-1">
              Все статьи УК <ArrowRight className="h-3 w-3" />
            </Link>
            <Link to="/administrative-code" className="text-sm text-primary hover:underline flex items-center gap-1">
              Все статьи АК <ArrowRight className="h-3 w-3" />
            </Link>
            <Link to="/cheat-sheet" className="text-sm text-primary hover:underline flex items-center gap-1">
              Шпаргалка <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        {/* SECTION 3: Notations */}
        <section id="notations" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Обозначения</h2>
          </div>
          
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {notations.map((n) => (
              <div key={n.symbol} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30">
                <span className="text-2xl font-bold shrink-0 w-10 text-center">{n.symbol}</span>
                <div>
                  <p className="text-sm font-semibold">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Do's and Don'ts */}
        <section id="dos-donts" className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-2xl font-bold">Что можно и нельзя</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" /> Нужно делать
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  "Всегда представляться при контакте с гражданским",
                  "Зачитывать права Миранды при задержании",
                  "Составлять рапорт после каждого задержания",
                  "Носить форму и бейдж на дежурстве",
                  "Запрашивать ордер для обыска помещений",
                  "Сохранять спокойствие и действовать по процедуре",
                  "Фиксировать улики и вещественные доказательства",
                  "Использовать рацию для координации",
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <XCircle className="h-5 w-5" /> Нельзя делать
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  "Задерживать без указания причины/статьи",
                  "Проводить обыск помещений без ордера",
                  "Применять оружие без предупреждения",
                  "Изымать имущество без оснований",
                  "Превышать должностные полномочия",
                  "Брать взятки или вымогать",
                  "Игнорировать права задержанного",
                  "Действовать вне зоны юрисдикции без оснований",
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 5: Rights of Miranda */}
        <section className="mb-12">
          <Card className="bg-card/40 backdrop-blur border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Права Миранды (зачитать при задержании)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                <p className="text-sm leading-relaxed italic">
                  «Вы имеете право хранить молчание. Всё, что вы скажете, может и будет 
                  использовано против вас в суде. Вы имеете право на адвоката. Если вы не 
                  можете позволить себе адвоката, он будет назначен вам государством. 
                  Вы понимаете свои права?»
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                ⚠️ Без зачитывания прав Миранды задержание считается незаконным и может быть оспорено в суде.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Quick Links */}
        <section className="text-center">
          <p className="text-muted-foreground text-sm mb-4">Полезные разделы</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/procedural-code" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm hover:bg-primary/20 transition-colors">
              📋 Процессуальный кодекс
            </Link>
            <Link to="/procedures" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm hover:bg-primary/20 transition-colors">
              📖 Процедуры
            </Link>
            <Link to="/cheat-sheet" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm hover:bg-primary/20 transition-colors">
              📝 Шпаргалка
            </Link>
            <Link to="/glossary" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm hover:bg-primary/20 transition-colors">
              📚 Глоссарий
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
