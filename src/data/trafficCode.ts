export interface TrafficArticle {
  id: string;
  article: string;
  description: string;
  fine: string;
}

export const trafficArticles: TrafficArticle[] = [
  {
    id: "1",
    article: "Статья 1.0",
    description: "Водитель по требованию должен предоставить лицензии",
    fine: "$5,000"
  },
  {
    id: "2",
    article: "Статья 2.0",
    description: "Водитель должен остановиться и по требованию покинуть Т/С",
    fine: "$5,000"
  },
  {
    id: "5",
    article: "Статья 5.0",
    description: "Если при аварии погибли люди, водитель обязан вызвать EMS",
    fine: "$20,000"
  },
  {
    id: "6",
    article: "Статья 6.0",
    description: "Запрещено передавать управление лицам, без лицензий вождения",
    fine: "$10,000"
  },
  {
    id: "9",
    article: "Статья 9.0",
    description: "Безрассудное вождение",
    fine: "$10,000"
  },
  {
    id: "16",
    article: "Статья 16.0",
    description: "Передвижение пешехода по проезжей части",
    fine: "$7,000"
  },
  {
    id: "19",
    article: "Статья 19.0",
    description: "При перестроении, водитель обязан уступить дорогу",
    fine: "$8,000"
  },
  {
    id: "26",
    article: "Статья 26.0",
    description: "Движение по встречной полосе",
    fine: "$15,000"
  },
  {
    id: "28",
    article: "Статья 28.0",
    description: "Езда по тротуару, обочинам",
    fine: "$15,000"
  },
  {
    id: "36",
    article: "Статья 36.0",
    description: "Парковка только в один ряд параллельно краю проезжей части",
    fine: "$5,000"
  },
  {
    id: "37",
    article: "Статья 37.0",
    description: "Остановка: красный бордюр, пешеходы, ж/д, перекрёсток",
    fine: "$5,000"
  },
  {
    id: "38",
    article: "Статья 38.0",
    description: "Остановка на автомагистрали",
    fine: "$9,000"
  },
  {
    id: "56",
    article: "Статья 56.0",
    description: "Езда без номеров",
    fine: "$20,000"
  }
];
