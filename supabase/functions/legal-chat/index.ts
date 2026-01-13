import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Criminal Code Data
const criminalArticles = [
  { article: "6.1", stars: 3, court: true, description: "Нанесение тяжких телесных", fine: "" },
  { article: "6.1 ч.1", stars: 2, court: true, description: "Нанесение телесных повреждений", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "6.1 ч.2", stars: 3, court: true, description: "Тяжкие телесные повреждения", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "6.1 ч.3", stars: 2, court: true, description: "Тяжкие телесные: неосторожность/аффект", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "6.2", stars: 4, court: true, description: "Убийство", fine: "" },
  { article: "6.2 ч.1", stars: 4, court: true, description: "Убийство", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "6.2 ч.2", stars: 3, court: true, description: "Лишение жизни человека", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "6.3", stars: 5, court: true, description: "Тяжкое убийство", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "6.6", stars: 3, court: true, description: "Угроза убийством/тяжким вредом", fine: "от 10 до 30 месяцев лишения свободы, либо уголовный штраф в размере от 30.000$ до 50.000$" },
  { article: "6.7", stars: 2, court: true, description: "Воспрепятствование медпомощи", fine: "от 10 до 30 месяцев лишения свободы, либо уголовный штраф в размере от 5.000$ до 20.000$" },
  { article: "7.1", stars: 4, court: true, description: "Похищение человека", fine: "" },
  { article: "7.1 ч.1", stars: 4, court: true, description: "Похищение человека, захват заложника", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "7.1.1", stars: 3, court: true, description: "Незаконное удержание", fine: "" },
  { article: "7.1.1 ч.1", stars: 3, court: true, description: "Незаконное лишение свободы", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "7.2", stars: 4, court: true, description: "Использование рабского труда", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "7.3", stars: 5, court: true, description: "Торговля людьми", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "7.4", stars: 2, court: true, description: "Клевета", fine: "" },
  { article: "7.4 ч.1", stars: 2, court: true, description: "Клевета", fine: "от 20 до 30 месяцев лишения свободы, либо уголовный штраф от 40.000$ до 50.000$" },
  { article: "7.4 ч.2", stars: 3, court: true, description: "Публичная клевета в СМИ/интернете", fine: "от 20 до 30 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 60.000$" },
  { article: "7.4 ч.3", stars: 3, court: true, description: "Клевета должностным лицом", fine: "от 20 до 30 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 60.000$" },
  { article: "7.4 ч.4", stars: 3, court: true, description: "Клевета об опасном заболевании", fine: "от 20 до 30 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 70.000$" },
  { article: "7.4 ч.5", stars: 3, court: true, description: "Клевета в тяжком преступлении", fine: "от 20 до 30 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 80.000$" },
  { article: "8.1", stars: 4, court: true, description: "Изнасилование", fine: "" },
  { article: "8.1 ч.1", stars: 4, court: true, description: "Изнасилование", fine: "Лишение свободы на срок от 20 до 40 месяцев" },
  { article: "8.1 ч.2", stars: 4, court: true, description: "Изнасилование с отягчающими", fine: "Лишение свободы на срок от 30 до 40 месяцев" },
  { article: "8.2", stars: 3, court: true, description: "Понуждение к сексуальным действиям", fine: "Лишение свободы на срок от 20 до 30 месяцев" },
  { article: "8.3", stars: 2, court: true, description: "Сексуальное домогательство", fine: "Лишение свободы на срок от 10 до 30 месяцев" },
  { article: "9.1", stars: 4, court: true, description: "Воспрепятствование избирательным правам", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "9.2", stars: 4, court: true, description: "Помеха работе Сената", fine: "" },
  { article: "9.2 ч.1", stars: 4, court: true, description: "Воспрепятствование деятельности Сената", fine: "от 20 до 50 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 100.000$" },
  { article: "9.2 ч.2", stars: 4, court: true, description: "Срыв заседания Сената", fine: "от 20 до 50 месяцев лишения свободы, либо уголовный штраф от 50.000$ до 100.000$" },
  { article: "10.1", stars: 2, court: true, description: "Кража", fine: "" },
  { article: "10.1 ч.1", stars: 2, court: true, description: "Кража", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "10.1.1", stars: 3, court: true, description: "Кража со взломом", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "10.2", stars: 3, court: true, description: "Мошенничество", fine: "лишение свободы сроком от 10 до 30 месяцев, возмещение украденного имущества" },
  { article: "10.3", stars: 4, court: true, description: "Разбой с оружием/насилием", fine: "лишение свободы сроком от 30 до 50 месяцев" },
  { article: "10.4", stars: 2, court: true, description: "Завладение ТС", fine: "лишение свободы сроком от 10 до 30 месяцев" },
  { article: "10.5", stars: 2, court: true, description: "Перемещение угнанного транспорта", fine: "лишение свободы сроком от 10 до 20 месяцев" },
  { article: "10.6", stars: 2, court: true, description: "Умышленная порча имущества", fine: "лишение свободы сроком от 10 до 30 месяцев" },
  { article: "10.7", stars: 2, court: true, description: "Уничтожение или порча госимущества", fine: "лишение свободы сроком от 10 до 30 месяцев" },
  { article: "10.8", stars: 2, court: true, description: "Срыв печатей, проникновение", fine: "лишение свободы сроком от 10 до 20 месяцев" },
  { article: "10.9", stars: 2, court: true, description: "Незаконное проникновение в жилище", fine: "лишение свободы сроком от 10 до 20 месяцев" },
  { article: "11.1", stars: 2, court: true, description: "Незаконное предпринимательство", fine: "от 10 до 30 месяцев лишения свободы, либо уголовный штраф в размере от 20.000$ до 30.000$" },
  { article: "11.2", stars: 3, court: true, description: "Принуждение к сделке", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "11.3", stars: 4, court: true, description: "Уклонение от налогов", fine: "принудительное взыскание суммы долга в 2-х кратном размере, либо от 30 до 50 месяцев лишения свободы" },
  { article: "11.4", stars: 4, court: true, description: "Сокрытие имущества от налогов", fine: "принудительное взыскание в 2-х кратном размере, либо от 20 до 50 месяцев лишения свободы" },
  { article: "11.5", stars: 3, court: true, description: "Ограничение конкуренции", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "11.6", stars: 4, court: true, description: "Махинации с госбюджетом", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "11.7", stars: 5, court: true, description: "Финансирование экстремизма и терроризма", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "12.1", stars: 5, court: true, description: "Терроризм", fine: "от 50 до 100 месяцев лишения свободы" },
  { article: "12.1.1", stars: 4, court: true, description: "Пропаганда и оправдание терроризма", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "12.1.2 ч.1", stars: 5, court: true, description: "Пропаганда и вовлечение в терроризм", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.2 ч.1", stars: 2, court: true, description: "Несообщение о преступлении", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "12.3 ч.1", stars: 3, court: true, description: "Ложное сообщение о теракте", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "12.4 ч.1", stars: 4, court: true, description: "Возбуждение ненависти или вражды", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "12.4 ч.2", stars: 4, court: true, description: "Экстремизм: насилие, должностное, группа", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "12.5 ч.1", stars: 4, court: true, description: "Организация запрещенной экстремистской организации", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "12.5 ч.3", stars: 5, court: true, description: "Организация экстремистской организации", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.6 ч.1", stars: 2, court: true, description: "Нарушение порядка митингов", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "12.6.1 ч.1", stars: 3, court: true, description: "Организация массовых беспорядков", fine: "от 20 до 30 месяцев лишения свободы" },
  { article: "12.7 ч.1", stars: 2, court: true, description: "Проникновение на закрытую территорию", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 50.000$" },
  { article: "12.7 ч.2", stars: 5, court: true, description: "Проникновение на спецобъекты", fine: "от 40 до 50 месяцев лишения свободы, либо штраф от 60.000$ до 80.000$" },
  { article: "12.8 ч.1", stars: 4, court: true, description: "Незаконный оборот оружия, спецсредств", fine: "от 30 до 40 месяцев лишения свободы, либо штраф от 10.000$ до 30.000$" },
  { article: "12.8.1", stars: 5, court: true, description: "Хранение спецсредств гос. образца", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.9", stars: 5, court: true, description: "Незаконный оборот взрывчатки", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.10", stars: 5, court: true, description: "Хищение оружия и боеприпасов", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.10.1", stars: 5, court: true, description: "Хищение оружия и вещдоков сотрудником", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.11", stars: 5, court: true, description: "Незаконное вооруженное формирование", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.12", stars: 5, court: true, description: "Организация и участие в ОПС", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "12.13", stars: 5, court: true, description: "Незаконное получение гостайны", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "13.1", stars: 3, court: true, description: "Производство и сбор наркотиков", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 40.000$" },
  { article: "13.2", stars: 4, court: true, description: "Незаконный оборот наркотиков (3г+)", fine: "от 30 до 40 месяцев лишения свободы, либо штраф от 40.000$ до 60.000$" },
  { article: "13.2.1", stars: 5, court: true, description: "Оборот, сбыт наркотиков >25г", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "13.3", stars: 3, court: true, description: "Организация и вовлечение в проституцию", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 25.000$ до 50.000$" },
  { article: "13.4", stars: 5, court: true, description: "Наркооборот госслужащим", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "13.6 ч.1", stars: 2, court: true, description: "Перевозка по поддельным документам", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 25.000$ до 50.000$" },
  { article: "13.6 ч.2", stars: 3, court: true, description: "Перевозка груза по подделкам", fine: "от 20 до 40 месяцев лишения свободы, либо штраф от 40.000$ до 70.000$" },
  { article: "13.6 ч.3", stars: 4, court: true, description: "Перевозка запрещенного по подлогам", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "14.1", stars: 5, court: true, description: "Публичная дискредитация госорганов", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "14.2", stars: 5, court: true, description: "Захват власти, мятеж", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "14.2.1", stars: 5, court: true, description: "Сепаратизм, посягательство на целостность", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "14.3 ч.1", stars: 4, court: true, description: "Разглашение гостайны", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "14.3.1 ч.1", stars: 4, court: true, description: "Незаконное получение гостайны", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "14.3.2 ч.1", stars: 4, court: true, description: "Утрата гостайны", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "15.1 ч.1", stars: 4, court: true, description: "Превышение должностных полномочий", fine: "от 30 до 40 месяцев лишения свободы, либо штраф от 40.000$ до 100.000$" },
  { article: "15.1 ч.2", stars: 5, court: true, description: "Превышение полномочий при отягчающих", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "15.1.1 ч.1", stars: 5, court: true, description: "Злоупотребление должностными полномочиями", fine: "от 40 до 50 месяцев лишения свободы, либо штраф от 50.000$ до 100.000$" },
  { article: "15.2 ч.1", stars: 3, court: true, description: "Неисполнение приказа госслужащим", fine: "от 20 до 40 месяцев лишения свободы, либо штраф от 30.000$ до 40.000$" },
  { article: "15.3 ч.1", stars: 3, court: true, description: "Присвоение полномочий должностного лица", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "15.3 ч.3", stars: 4, court: true, description: "Присвоение полномочий: смерть/вред", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "15.4", stars: 5, court: true, description: "Получение взятки", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "15.5", stars: 5, court: true, description: "Дача взятки", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "15.5.1", stars: 5, court: true, description: "Посредничество во взяточничестве", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "15.6 ч.1", stars: 3, court: true, description: "Халатность должностного лица", fine: "от 20 до 40 месяцев лишения свободы, либо штраф от 40.000$ до 70.000$" },
  { article: "15.6 ч.2", stars: 4, court: true, description: "Халатность: смерть, тяжкий вред", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "15.7 ч.1", stars: 2, court: true, description: "Нарушение этики должностным лицом", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 30.000$ до 70.000$" },
  { article: "16.1 ч.1", stars: 4, court: true, description: "Воспрепятствование правосудию и следствию", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "16.1.1 ч.1", stars: 4, court: true, description: "Воспрепятствование деятельности защитника", fine: "от 30 до 40 месяцев лишения свободы, либо штраф от 40.000$ до 80.000$" },
  { article: "16.2", stars: 5, court: true, description: "Посягательство на участников правосудия", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.3", stars: 4, court: true, description: "Привлечение заведомо невиновного", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "16.4", stars: 4, court: true, description: "Незаконное задержание или арест", fine: "от 30 до 50 месяцев лишения свободы" },
  { article: "16.5", stars: 5, court: true, description: "Фальсификация доказательств в суде", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.6", stars: 5, court: true, description: "Фальсификация доказательств по уголовке", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.7", stars: 5, court: true, description: "Неправосудное решение", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.8", stars: 5, court: true, description: "Ложные показания или заключение", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.9", stars: 5, court: true, description: "Подкуп за ложные показания", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "16.10 ч.1", stars: 4, court: true, description: "Неисполнение судебных и следственных актов", fine: "от 30 до 40 месяцев лишения свободы, либо штраф от 30.000$ до 70.000$" },
  { article: "16.11", stars: 4, court: true, description: "Сокрытие/уничтожение улик", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "16.12", stars: 4, court: true, description: "Уклонение от следствия и суда", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "16.13", stars: 4, court: true, description: "Ложные показания адвокату/прокурору", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "16.14", stars: 2, court: true, description: "Отказ от показаний и экспертиз", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "16.15", stars: 4, court: true, description: "Уклонение от отбывания наказания", fine: "от 10 до 50 месяцев лишения свободы" },
  { article: "17.1", stars: 5, court: true, description: "Посягательство на жизнь силовика", fine: "от 40 до 50 месяцев лишения свободы" },
  { article: "17.2", stars: 4, court: true, description: "Насилие против представителя власти", fine: "от 30 до 40 месяцев лишения свободы" },
  { article: "17.3", stars: 2, court: true, description: "Оскорбление представителя власти", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 50.000$" },
  { article: "17.4", stars: 2, court: true, description: "Помеха работе госслужащего", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 60.000$" },
  { article: "17.5", stars: 2, court: true, description: "Самоуправство", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "17.6", stars: 3, court: true, description: "Неповиновение или воспрепятствование госслужащему", fine: "от 20 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 60.000$" },
  { article: "17.7", stars: 3, court: true, description: "Неуплата штрафа и ущерба", fine: "от 10 до 40 месяцев лишения свободы, либо штраф от 20.000$ до 100.000$" },
  { article: "17.8", stars: 3, court: true, description: "Подделка и сбыт документов", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "18.1", stars: 2, court: true, description: "Неисполнение приказа", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 10.000$ до 30.000$" },
  { article: "18.2", stars: 2, court: true, description: "Самовольное оставление части", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 10.000$ до 30.000$" },
  { article: "18.3", stars: 3, court: true, description: "Дезертирство", fine: "от 20 до 40 месяцев лишения свободы, либо штраф от 15.000$ до 50.000$" },
  { article: "18.4", stars: 2, court: true, description: "Нарушение правил боевого дежурства", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 10.000$ до 30.000$" },
  { article: "18.5", stars: 2, court: true, description: "Уничтожение/повреждение военного имущества", fine: "от 10 до 30 месяцев лишения свободы" },
  { article: "18.5.1", stars: 3, court: true, description: "Неосторожное уничтожение военного имущества", fine: "от 20 до 40 месяцев лишения свободы, либо штраф от 5.000$ до 15.000$" },
  { article: "18.6", stars: 3, court: true, description: "Нарушение вождения спецтехники, тяжкий вред", fine: "от 20 до 40 месяцев лишения свободы" },
  { article: "19.1", stars: 3, court: true, description: "Незаконная добыча ресурсов", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 20.000$ до 100.000$" },
  { article: "19.2 ч.1", stars: 2, court: true, description: "Жестокое обращение с животными", fine: "от 10 до 20 месяцев лишения свободы, либо штраф от 1.000$ до 10.000$" },
  { article: "19.2 ч.2", stars: 2, court: true, description: "Жестокое обращение с животными", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 10.000$ до 30.000$" },
  { article: "19.3 ч.1", stars: 2, court: true, description: "Изнасилование животного", fine: "от 10 до 20 месяцев лишения свободы, либо штраф от 1.000$ до 10.000$" },
  { article: "19.3 ч.2", stars: 2, court: true, description: "Изнасилование скота", fine: "от 10 до 20 месяцев лишения свободы, либо штраф от 1.000$ до 10.000$" },
  { article: "19.3 ч.3", stars: 2, court: true, description: "Изнасилование животного (отягчающие обстоятельства)", fine: "от 10 до 30 месяцев лишения свободы, либо штраф от 1.000$ до 10.000$" },
];

// Administrative Code Data
const adminArticles = [
  { article: "2.1 АК", description: "Мелкое хулиганство", fine: "штраф от 3.000$ до 7.000$" },
  { article: "2.2 АК", description: "Непристойный вид и опьянение в общественном месте", fine: "штраф от 3.000$ до 7.000$" },
  { article: "2.3 АК", description: "Нарушение порядка собраний и митингов", fine: "штраф в размере 20.000$" },
  { article: "2.4 АК", description: "Нецелевое использование оружия и инвентаря в людном месте", fine: "штраф от 1.000$ до 12.000$" },
  { article: "2.5 АК", description: "Побои без вреда здоровью", fine: "штраф от 5.000$ до 20.000$" },
  { article: "2.6 АК", description: "Неуважение к Сенату Сан-Андреаса", fine: "штраф от 15.000$ до 75.000$ или до 20 суток ограничения свободы" },
  { article: "2.8 АК", description: "Обнажение или применение оружия в общественных местах", fine: "Штраф от 5.000$ до 20.000$" },
  { article: "2.9 АК", description: "Отсутствие удостоверения у госслужащего", fine: "Штраф от 5.000$ до 20.000$" },
  { article: "3.1 АК", description: "Дискриминация", fine: "штраф от 1.500$ до 8.500$" },
  { article: "3.2 АК", description: "Дискриминация в труде", fine: "штраф работодателю от 40.000$ до 75.000$" },
  { article: "3.3 АК", description: "Нарушение требований охраны труда", fine: "штраф от 20.000$ до 60.000$, юр.лицам — от 75.000$ до 100.000$" },
  { article: "3.4 АК", description: "Нарушение неприкосновенности частной жизни и телефонный терроризм", fine: "штраф в размере 8.000$" },
  { article: "3.5 АК", description: "Разжигание ненависти и унижение достоинства", fine: "штраф от 25.000$ до 50.000$" },
  { article: "3.6 АК", description: "Умышленное повреждение чужого имущества", fine: "штраф в размере 7.000$" },
  { article: "3.7 АК", description: "Воспрепятствование медпомощи", fine: "штраф от 10.000$ до 15.000$" },
  { article: "3.7.1 АК", description: "Неоказание помощи обязанным лицом, повлекшее вред здоровью", fine: "штраф в размере 15.000$" },
  { article: "3.8 АК", description: "Нарушение права работника на перерыв или отпуск", fine: "штраф работодателю в размере 40.000$" },
  { article: "3.9 АК", description: "Несоответствие ПВТР законодательству", fine: "штраф работодателю в размере 100.000$" },
  { article: "3.10 АК", description: "Незаконное распространение сведений о частной жизни без согласия", fine: "штраф в размере 8.000$" },
  { article: "3.11 АК", description: "Незаконное проникновение в жилище с использованием служебного положения", fine: "штраф в размере 12.000$" },
  { article: "3.12 АК", description: "Воспрепятствование работе журналистов", fine: "штраф в размере 10.000$" },
  { article: "4.1 АК", description: "Незаконная рыбалка и охота", fine: "Штраф 15.000$" },
  { article: "5.1 АК", description: "Заведомо ложный донос", fine: "от 5.000$ до 9.500$" },
  { article: "5.1 ч.2 АК", description: "Ложный донос о преступлении; Ложный вызов Генпрокуратуры", fine: "от 20.000$ до 30.000$" },
  { article: "5.2 АК", description: "Воспрепятствование задержанию и разбирательству", fine: "штраф в размере 8.000$" },
  { article: "5.3 АК", description: "Необеспечение явки на плановую проверку", fine: "штраф на организацию до 350.000$" },
  { article: "5.4 АК", description: "Ненадлежащее предоставление сведений по адвзапросу", fine: "штраф до 150.000$" },
  { article: "6.1 АК", description: "Клевета в СМИ или при должностном положении", fine: "штраф от 1.000$ до 10.000$" },
  { article: "6.2 АК", description: "Клевета с обвинением в преступлении", fine: "штраф от 1.000$ до 7.500$" },
  { article: "6.3 АК", description: "Клевета в отношении гражданина штата", fine: "штраф от 1.000$ до 5.000$" },
  { article: "6.4 АК", description: "Оскорбление", fine: "штраф от 2.000$ до 5.000$" },
  { article: "6.4 ч.2 АК", description: "Оскорбление нецензурной формой", fine: "штраф в размере 4.000$" },
  { article: "7.1 АК", description: "Оказание неквалифицированной медпомощи", fine: "штраф 10.000$ + возмещение ущерба по решению суда" },
  { article: "7.2 АК", description: "Отсутствие медсправок у госслужащего", fine: "штраф 5.000$" },
  { article: "7.3 АК", description: "Нарушение правил режима повышенной готовности", fine: "штраф 7.500$" },
  { article: "7.4 АК", description: "Отказ от санитарной проверки", fine: "штраф на организацию 100.000$" },
  { article: "7.5 АК", description: "Отказ от санитарной проверки", fine: "штраф на организацию 110.000$" },
  { article: "7.6 АК", description: "Многократный отказ EMS от санитарной проверки", fine: "штраф на организацию 200.000$; штраф ответственному лицу 11.000$" },
  { article: "7.7 АК", description: "Многократный отказ от санпроверки", fine: "штраф на организацию 170.000$; штраф ответственному лицу 15.000$" },
  { article: "7.8 АК", description: "Неудовлетворительная оценка санитарных норм", fine: "штраф на организацию до 80.000$" },
  { article: "7.9 АК", description: "Халатность при обеспечении санитарной безопасности", fine: "штраф на организацию 100.000$; штраф ответственному лицу 10.000$" },
  { article: "7.10 АК", description: "Халатность санитарно-эпидслужбы", fine: "штраф на организацию 60.000$; штраф ответственному лицу 6.000$" },
  { article: "7.11 АК", description: "Уклонение от санитарной проверки", fine: "штраф на организацию 160.000$; штраф ответственному лицу 10.000$" },
  { article: "7.12 АК", description: "Многократное уклонение от санитарной проверки", fine: "штраф на организацию 200.000$; штраф ответственному лицу 15.000$" },
  { article: "7.13 АК", description: "Отказ в проверке пожарной безопасности", fine: "штраф на организацию 120.000$" },
  { article: "7.14 АК", description: "Неудовлетворительная оценка пожарной безопасности", fine: "штраф на организацию до 100.000$" },
  { article: "7.15 АК", description: "Отказ от пожарной проверки", fine: "штраф на организацию 160.000$" },
  { article: "7.16 АК", description: "Отказ от медосвидетельствования", fine: "штраф на организацию 120.000$" },
  { article: "7.17 АК", description: "Отказ от медосвидетельствования", fine: "штраф на организацию 160.000$" },
  { article: "7.18 АК", description: "Многократный отказ EMS от медосмотра", fine: "штраф на организацию 250.000$; штраф ответственному лицу 20.000$" },
  { article: "7.19 АК", description: "Непредставление отчётности о финдеятельности", fine: "штраф до 40.000$" },
  { article: "7.20 АК", description: "Предоставление недостоверной финансовой информации", fine: "от 15.000$ до 50.000$" },
  { article: "7.21 АК", description: "Нарушение финансового законодательства", fine: "от 8.000$ до 51.000$" },
  { article: "8.1 АК", description: "Незаконное хранение наркотиков до 3 граммов", fine: "от 5.000$ до 20.000$" },
];

// Traffic Code Data
const trafficArticles = [
  { article: "Статья 1.0", description: "Водитель по требованию должен предоставить лицензии", fine: "$5,000" },
  { article: "Статья 2.0", description: "Водитель должен остановиться и по требованию покинуть Т/С", fine: "$5,000" },
  { article: "Статья 5.0", description: "Если при аварии погибли люди, водитель обязан вызвать EMS", fine: "$20,000" },
  { article: "Статья 6.0", description: "Запрещено передавать управление лицам, без лицензий вождения", fine: "$10,000" },
  { article: "Статья 9.0", description: "Безрассудное вождение", fine: "$10,000" },
  { article: "Статья 16.0", description: "Передвижение пешехода по проезжей части", fine: "$7,000" },
  { article: "Статья 19.0", description: "При перестроении, водитель обязан уступить дорогу", fine: "$8,000" },
  { article: "Статья 26.0", description: "Движение по встречной полосе", fine: "$15,000" },
  { article: "Статья 28.0", description: "Езда по тротуару, обочинам", fine: "$15,000" },
  { article: "Статья 36.0", description: "Парковка только в один ряд параллельно краю проезжей части", fine: "$5,000" },
  { article: "Статья 37.0", description: "Остановка: красный бордюр, пешеходы, ж/д, перекрёсток", fine: "$5,000" },
  { article: "Статья 38.0", description: "Остановка на автомагистрали", fine: "$9,000" },
  { article: "Статья 56.0", description: "Езда без номеров", fine: "$20,000" },
];

// Format articles for system prompt
const formatCriminalArticles = () => {
  return criminalArticles.map(a => 
    `Ст. ${a.article}: ${a.description} | ${a.stars} звезд${a.stars === 1 ? 'а' : a.stars < 5 ? 'ы' : ''} | ${a.court ? 'через суд' : ''} | ${a.fine || 'см. УК'}`
  ).join('\n');
};

const formatAdminArticles = () => {
  return adminArticles.map(a => 
    `${a.article}: ${a.description} | ${a.fine}`
  ).join('\n');
};

const formatTrafficArticles = () => {
  return trafficArticles.map(a => 
    `${a.article}: ${a.description} | ${a.fine}`
  ).join('\n');
};

// Function to fetch laws from database
async function fetchLawsFromDB(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials not found, skipping laws fetch");
    return "";
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: laws, error } = await supabase
      .from("laws")
      .select("title, short_title, type, content")
      .order("order_index", { ascending: true });
    
    if (error) {
      console.error("Error fetching laws:", error);
      return "";
    }
    
    if (!laws || laws.length === 0) {
      return "";
    }
    
    return laws.map(law => {
      const typeLabel = law.type === "code" ? "Кодекс" : "Закон";
      return `=== ${typeLabel}: ${law.title} (${law.short_title}) ===\n${law.content}`;
    }).join('\n\n');
  } catch (err) {
    console.error("Failed to fetch laws:", err);
    return "";
  }
}

const buildSystemPrompt = (lawsContent: string) => `Ты — AI-юрист портала HARDY для Majestic RP. Ты эксперт по законодательству Majestic RP и отвечаешь на вопросы по:
- Уголовному кодексу (УК)
- Административному кодексу (КоАП/АК)
- Дорожному кодексу (ПДД)
- Законам штата Сан-Андреас
- Процедурам для госслужащих
- Правилам государственных организаций

Правила ответов:
1. Отвечай кратко и по существу
2. ОБЯЗАТЕЛЬНО указывай точные номера статей из базы данных ниже
3. Указывай ТОЧНЫЙ размер штрафов и сроков из базы данных
4. Если вопрос не относится к законодательству Majestic RP — вежливо откажись
5. Отвечай на русском языке
6. Используй форматирование: заголовки, списки, выделения
7. Если не знаешь точного ответа — скажи об этом честно

=== ПОЛНАЯ БАЗА УГОЛОВНОГО КОДЕКСА (УК) ===
${formatCriminalArticles()}

=== ПОЛНАЯ БАЗА АДМИНИСТРАТИВНОГО КОДЕКСА (АК/КоАП) ===
${formatAdminArticles()}

=== ПОЛНАЯ БАЗА ДОРОЖНОГО КОДЕКСА (ПДД) ===
${formatTrafficArticles()}

${lawsContent ? `=== ЗАКОНЫ И КОДЕКСЫ ШТАТА САН-АНДРЕАС ===\n${lawsContent}` : ''}

=== СИСТЕМА ЗВЁЗД ===
- 1 звезда: незначительные нарушения
- 2 звезды: мелкие преступления
- 3 звезды: серьёзные преступления
- 4 звезды: тяжкие преступления
- 5 звёзд: особо тяжкие преступления (терроризм, убийство и т.д.)

При ответе на вопрос "за что могут дать X звёзд" — перечисли ВСЕ подходящие статьи из базы данных выше.
При вопросе о конкретной статье — дай полную информацию: номер, описание, звёзды, штраф/срок, нужен ли суд.
При вопросе о законах штата — используй информацию из раздела "ЗАКОНЫ И КОДЕКСЫ ШТАТА САН-АНДРЕАС".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received chat request with", messages.length, "messages");

    // Fetch laws from database
    const lawsContent = await fetchLawsFromDB();
    console.log("Fetched laws content length:", lawsContent.length);
    
    const systemPrompt = buildSystemPrompt(lawsContent);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Подождите немного." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Превышен лимит использования AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
