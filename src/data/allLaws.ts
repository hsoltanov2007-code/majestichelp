import { constitution, immunityLaw, laborCode, lawEnforcementLaw, secretServiceLaw, allLaws as originalLaws } from "./laws";
import { proceduralCode } from "./proceduralCode";
import { criminalArticles } from "./criminalCode";
import { adminArticles } from "./administrativeCode";
import { trafficArticles } from "./trafficCode";
import { proceduralCodeFull, trafficCodeFull, constitutionFull, type FullLaw } from "./fullLaws";

export interface LawListItem {
  id: string;
  title: string;
  shortTitle: string;
  type: 'law' | 'code';
  forumUrl?: string;
}

export const allLawsList: LawListItem[] = [
  { id: "procedural-code", title: "Процессуальный кодекс штата San-Andreas", shortTitle: "ПК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/protsessual-nyi-kodeks-shtata-san-andreas.2579857/" },
  { id: "traffic-code", title: "Дорожный кодекс штата San-Andreas", shortTitle: "ДК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/dorozhnyi-kodeks-shtata-san-andreas.2579876/" },
  { id: "criminal-code", title: "Уголовный кодекс штата San-Andreas", shortTitle: "УК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/ugolovnyj-kodeks-shtata-san-andreas.2579868/" },
  { id: "labor-code", title: "Трудовой кодекс штата San-Andreas", shortTitle: "ТК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/trudovoj-kodeks-shtata-san-andreas.2579877/" },
  { id: "constitution", title: "Конституция штата San-Andreas", shortTitle: "Конституция", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/konstitutsiya-shtata-san-andreas.2579865/" },
  { id: "administrative-code", title: "Административный кодекс штата San-Andreas", shortTitle: "АК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/administrativnyj-kodeks-shtata-san-andreas.2579871/" },
  { id: "civil-code", title: "Гражданский кодекс штата San-Andreas", shortTitle: "ГК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/grazhdanskii-kodeks-shtata-san-andreas.2579877/" },
  { id: "ethical-code", title: "Этический кодекс штата San-Andreas", shortTitle: "ЭК", type: "code", forumUrl: "https://forum.majestic-rp.ru/threads/eticheskij-kodeks-shtata-san-andreas.2580112/" },
  { id: "senate-law", title: "Конституционный закон О Сенате штата San-Andreas", shortTitle: "О Сенате", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/konstitutsionnyj-zakon-o-senate-shtata-san-andreas.2580085/" },
  { id: "territories-law", title: "Закон О государственных территориях штата San-Andreas", shortTitle: "О территориях", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennykh-territoriyakh-shtata-san-andreas.2579894/" },
  { id: "immunity-law", title: "Закон Об обеспечении неприкосновенности государственных служащих штата San-Andreas", shortTitle: "О неприкосновенности", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-ob-obespechenii-neprikosnovennosti-gosudarstvennykh-sluzhashchikh-shtata-san-andreas.2579888/" },
  { id: "lawyer-law", title: "Закон Об адвокатской деятельности и адвокатуре в Штате San-Andreas", shortTitle: "Об адвокатуре", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-ob-advokatskoj-deyatelnosti-i-advokature-v-shtate-san-andreas.2580265/" },
  { id: "weapons-law", title: "Закон О регулировании оборота оружия, боеприпасов и спецсредств в штате San-Andreas", shortTitle: "Об оружии", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-regulirovanii-oborota-oruzhiya-boepripasov-i-spetssredstv-v-shtate-san-andreas.2579891/" },
  { id: "government-law", title: "Конституционный Закон О Правительстве штата Сан-Андреас", shortTitle: "О Правительстве", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/konstitutsionnyj-zakon-o-pravitelstve-shtata-san-andreas.2580088/" },
  { id: "judicial-law", title: "Конституционный Закон О судебной системе штата Сан-Андреас", shortTitle: "О судебной системе", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/konstitutsionnyi-zakon-o-sudebnoi-sisteme-shtata-san-andreas.2579933/" },
  { id: "prosecutor-law", title: "Закон О деятельности офиса Генерального Прокурора штата San-Andreas", shortTitle: "О Генпрокуратуре", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-deyatelnosti-ofisa-generalnogo-prokurora-shtata-san-andreas.2580094/" },
  { id: "media-law", title: "Закон О средствах массовой информации", shortTitle: "О СМИ", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-sredstvakh-massovoj-informatsii.2580262/" },
  { id: "fib-law", title: "Закон О Федеральном Расследовательском Бюро", shortTitle: "О ФРБ", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-federal-nom-rassledovatel-skom-byuro.2579923/" },
  { id: "national-guard-law", title: "Закон О Национальной Гвардии штата Сан-Андреас", shortTitle: "О Нац. Гвардии", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-natsionalnoj-gvardii-shtata-san-andreas.2580103/" },
  { id: "emergency-law", title: "Закон О чрезвычайном и военном положении", shortTitle: "О ЧП", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-chrezvychajnom-i-voennom-polozhenii.2580106/" },
  { id: "regional-law-enforcement", title: "Закон О деятельности региональных правоохранительных органов", shortTitle: "О LSPD/LSCSD", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-deyatelnosti-regionalnykh-pravookhranitelnykh-organov.2580097/" },
  { id: "secret-service-law", title: "Закон О деятельности Секретной Службы Соединенных Штатов Америки в штате San-Andreas", shortTitle: "О USSS", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-deyatelnosti-sekretnoj-sluzhby-soedinyonnykh-shtatov-ameriki-v-shtate-san-andreas.2582270/" },
  { id: "business-law", title: "Закон О предпринимательской деятельности в штате San-Andreas", shortTitle: "О бизнесе", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-predprinimatelskoj-deyatelnosti-v-shtate-san-andreas.2580259/" },
  { id: "meetings-law", title: "Закон О собраниях, митингах и публичных мероприятиях", shortTitle: "О митингах", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-sobraniyakh-mitingakh-i-publichnykh-meropriyatiyakh.2580109/" },
  { id: "state-secret-law", title: "Закон О государственной тайне в Штате San-Andreas", shortTitle: "О гостайне", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennoj-tajne-v-shtate-san-andreas.2582408/" },
  { id: "ems-law", title: "Закон О деятельности Экстренной Медицинской Службы штата San-Andreas", shortTitle: "О EMS", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-deyatelnosti-ekstrennoj-meditsinskoj-sluzhby-shtata-san-andreas.2580253/" },
  { id: "parties-law", title: "Закон О политических партиях на территории штата San-Andreas", shortTitle: "О партиях", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-politicheskikh-partiyakh-na-territorii-shtata-san-andreas.2580250/" },
  { id: "terrorism-law", title: "Закон О противодействии терроризму", shortTitle: "О терроризме", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-protivodejstvii-terrorizmu.2580247/" },
  { id: "operative-law", title: "Закон Об оперативно-розыскной деятельности", shortTitle: "Об ОРД", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-ob-operativno-rozysknoj-deyatelnosti.2580244/" },
  { id: "hunting-law", title: "Закон Об охоте и рыбалке на территории штата San-Andreas", shortTitle: "Об охоте", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-ob-okhote-i-rybalke-na-territorii-shtata-san-andreas.2579895/" },
  { id: "awards-law", title: "Закон О Государственных наградах штата San-Andreas", shortTitle: "О наградах", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennykh-nagradakh-shtata-san-andreas.2579894/" },
  { id: "warrant-law", title: "Закон О системе ордеров штата San-Andreas", shortTitle: "Об ордерах", type: "law", forumUrl: "https://forum.majestic-rp.ru/threads/zakon-o-sisteme-orderov-shtata-san-andreas.2579881/" },
];

// Получить полный закон по ID
export function getFullLawById(id: string): FullLaw | undefined {
  switch (id) {
    case "procedural-code":
      return proceduralCodeFull;
    case "traffic-code":
      return trafficCodeFull;
    case "constitution":
      return constitutionFull;
    default:
      return undefined;
  }
}

export { constitution, immunityLaw, laborCode, lawEnforcementLaw, secretServiceLaw, originalLaws };
export { proceduralCode };
export { criminalArticles };
export { adminArticles };
export { trafficArticles };
export type { FullLaw };
