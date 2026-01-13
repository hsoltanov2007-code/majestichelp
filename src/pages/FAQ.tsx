import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Когда нужно зачитывать права Миранды?",
    answer: "Права Миранды зачитываются после надевания наручников, перед началом допроса. Это обязательно для всех задержаний по уголовным статьям. Формулировка: «Вы имеете право хранить молчание. Всё, что вы скажете, может и будет использовано против вас в суде. Вы имеете право на адвоката. Если вы не можете позволить себе адвоката, он будет предоставлен вам государством.»",
    category: "Процедуры"
  },
  {
    question: "Чем отличается залог от штрафа?",
    answer: "Штраф — это наказание, деньги уходят государству и не возвращаются. Залог — это гарантия явки в суд, он возвращается после судебного заседания (если подсудимый явился). Если статья требует суда, залог обычно не предусмотрен — задержанный содержится под стражей до суда.",
    category: "Финансы"
  },
  {
    question: "Сколько звёзд розыска за побег от полиции?",
    answer: "Попытка скрыться от полиции сама по себе не является отдельной статьёй, но может квалифицироваться как «Безрассудное вождение» (9.0 ДК) со штрафом $10,000. При отягчающих обстоятельствах (аварии, угроза жизни) могут применяться дополнительные статьи УК.",
    category: "Розыск"
  },
  {
    question: "Можно ли стрелять по колёсам убегающего автомобиля?",
    answer: "Применение огнестрельного оружия разрешено только при угрозе жизни сотрудника или граждан. Стрельба по колёсам допускается в исключительных случаях: когда водитель представляет непосредственную угрозу (например, пытается сбить пешеходов). При обычной погоне используйте шипы или PIT-манёвр.",
    category: "Применение силы"
  },
  {
    question: "Что делать, если подозреваемый отказывается выходить из машины?",
    answer: "1) Повторите требование громко и чётко. 2) Предупредите о последствиях неподчинения. 3) При продолжении отказа — вызовите подкрепление. 4) Можете применить спецсредства для извлечения (разбить окно, применить тазер). Каждое действие должно быть соразмерно угрозе.",
    category: "Процедуры"
  },
  {
    question: "Как определить, нужен ли суд по статье?",
    answer: "В карточке каждой статьи УК указано, требуется ли суд. Обычно суд нужен для статей с 4-5 звёздами розыска, где залог «Не предусмотрен». Это тяжкие преступления: убийство, разбой, изнасилование, торговля наркотиками в крупных размерах и т.д.",
    category: "Суд"
  },
  {
    question: "Может ли гражданский задержать преступника?",
    answer: "Да, в рамках «гражданского задержания» любой человек может задержать преступника, застигнутого на месте преступления, до прибытия полиции. Однако применение чрезмерной силы будет квалифицироваться как побои или превышение пределов необходимой обороны.",
    category: "Права граждан"
  },
  {
    question: "Что такое особо охраняемый объект?",
    answer: "Особо охраняемые объекты — это FIB и SANG. Проникновение на них карается статьёй 12.7 ч.2 УК (4 звезды, суд). Обычные охраняемые объекты — LSPD, LSSD, GOV — подпадают под статью 12.7 ч.1 (3 звезды).",
    category: "Объекты"
  },
  {
    question: "Как правильно конфисковать оружие?",
    answer: "1) Обезопасьте подозреваемого (наручники). 2) Изымите оружие, проверьте на наличие патронов. 3) Зафиксируйте изъятие в протоколе. 4) Проверьте оружие по базе данных (угнанное, зарегистрированное). 5) При отсутствии лицензии — применяйте статью 12.8 УК.",
    category: "Процедуры"
  },
  {
    question: "Какая разница между угоном и кражей автомобиля?",
    answer: "Угон (10.5 УК) — это временное завладение Т/С без цели хищения (покататься и бросить). Кража — это хищение с целью продажи или присвоения. На практике квалификация зависит от намерений, которые сложно доказать, поэтому чаще применяется статья об угоне.",
    category: "Классификация"
  },
  {
    question: "Нужно ли разрешение на обыск автомобиля?",
    answer: "Полный обыск Т/С требует либо согласия водителя, либо ордера, либо вероятной причины (запах наркотиков, видимое оружие, признания). При задержании водителя можно провести досмотр салона в зоне досягаемости задержанного без ордера.",
    category: "Процедуры"
  },
  {
    question: "Что делать с найденными наркотиками?",
    answer: "1) Зафиксируйте находку на камеру. 2) Взвесьте вещество. 3) До 3 грамм — статья 8.1 АК (штраф). 4) От 3 грамм — статья 13.2 УК (4 звезды, суд). 5) От 25 грамм — статья 13.2.1 УК (5 звёзд, суд). 6) Изымите как вещдок, передайте в лабораторию.",
    category: "Наркотики"
  }
];

const categories = [...new Set(faqItems.map((item) => item.category))];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Частые вопросы (FAQ)</h1>
            <p className="text-muted-foreground">
              Ответы на популярные вопросы по правилам
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск вопросов..."
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

        {/* FAQ Accordion */}
        <Accordion type="multiple" className="space-y-2">
          {filteredItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <span>{item.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-8 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Вопросы не найдены
          </div>
        )}
      </div>
    </Layout>
  );
}
