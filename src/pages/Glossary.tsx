import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "F/R (Felony/Розыск)",
    definition: "Обозначение тяжкого преступления, влекущего объявление в розыск. Буква F означает Felony (тяжкое преступление), R — розыск.",
    category: "Классификация"
  },
  {
    term: "Правило Миранды",
    definition: "Обязательное уведомление задержанного о его правах: право хранить молчание, право на адвоката, предупреждение о том, что всё сказанное может быть использовано против него в суде.",
    category: "Процедуры"
  },
  {
    term: "Уровень розыска (1-5⭐)",
    definition: "Степень опасности преступника. 1⭐ — минимальная угроза, 5⭐ — особо опасный преступник. Влияет на методы задержания и применяемую силу.",
    category: "Классификация"
  },
  {
    term: "КПЗ",
    definition: "Камера предварительного заключения — место временного содержания задержанных до суда или отправки в тюрьму.",
    category: "Места"
  },
  {
    term: "Залог (Bail)",
    definition: "Денежная сумма, которую задержанный может внести для освобождения до суда. При неявке в суд залог конфискуется.",
    category: "Финансы"
  },
  {
    term: "Штраф (Fine)",
    definition: "Денежное наказание, назначаемое за правонарушение. Может быть как фиксированным, так и в диапазоне сумм.",
    category: "Финансы"
  },
  {
    term: "Суд (Court)",
    definition: "Некоторые статьи требуют обязательного судебного разбирательства. В таких случаях залог обычно не предусмотрен.",
    category: "Процедуры"
  },
  {
    term: "LSPD",
    definition: "Los Santos Police Department — полицейский департамент Лос-Сантоса. Основное правоохранительное подразделение города.",
    category: "Организации"
  },
  {
    term: "LSSD",
    definition: "Los Santos Sheriff's Department — департамент шерифа округа Лос-Сантос. Отвечает за пригороды и округ.",
    category: "Организации"
  },
  {
    term: "FIB",
    definition: "Federal Investigation Bureau — аналог ФБР. Занимается федеральными преступлениями и особо важными делами.",
    category: "Организации"
  },
  {
    term: "SANG",
    definition: "San Andreas National Guard — Национальная гвардия. Привлекается в чрезвычайных ситуациях.",
    category: "Организации"
  },
  {
    term: "EMS",
    definition: "Emergency Medical Services — служба экстренной медицинской помощи. Вызывается при ранениях и ДТП.",
    category: "Организации"
  },
  {
    term: "Т/С",
    definition: "Транспортное средство — любой вид транспорта (автомобиль, мотоцикл, лодка и т.д.).",
    category: "Термины"
  },
  {
    term: "Аффект",
    definition: "Состояние сильного душевного волнения, при котором человек частично теряет контроль над своими действиями. Может смягчать наказание.",
    category: "Термины"
  },
  {
    term: "Рецидив",
    definition: "Повторное совершение преступления лицом, ранее судимым. Влечёт более строгое наказание.",
    category: "Термины"
  },
  {
    term: "Первичный обыск",
    definition: "Поверхностный обыск задержанного на наличие оружия и опасных предметов. Проводится в целях безопасности сотрудника.",
    category: "Процедуры"
  },
  {
    term: "Идентификация личности",
    definition: "Процедура установления личности задержанного по документам, базе данных или отпечаткам пальцев.",
    category: "Процедуры"
  },
  {
    term: "IB (Internal Bureau)",
    definition: "Отдел внутренних расследований — подразделение, расследующее преступления, совершённые сотрудниками гос. органов.",
    category: "Организации"
  },
  {
    term: "GOV",
    definition: "Government — правительственные здания и учреждения.",
    category: "Места"
  },
  {
    term: "ПДД / ДК",
    definition: "Правила дорожного движения / Дорожный кодекс — свод правил, регулирующих поведение на дорогах.",
    category: "Классификация"
  }
];

const categories = [...new Set(glossaryTerms.map((t) => t.category))];

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = glossaryTerms.filter((term) => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Глоссарий</h1>
            <p className="text-muted-foreground">
              Справочник терминов и сокращений
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск терминов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Terms Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTerms.map((term) => (
            <Card key={term.term}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{term.term}</CardTitle>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {term.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{term.definition}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Термины не найдены
          </div>
        )}
      </div>
    </Layout>
  );
}
