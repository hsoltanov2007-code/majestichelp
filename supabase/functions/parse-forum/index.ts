import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Forum URLs to parse - Majestic RP законодательство
const FORUM_URLS = [
  // Кодексы
  { url: "https://forum.majestic-rp.ru/threads/dorozhnyi-kodeks-shtata-san-andreas.2579876/", category: "traffic_code", title: "Дорожный кодекс (ДК)" },
  { url: "https://forum.majestic-rp.ru/threads/protsessual-nyi-kodeks-shtata-san-andreas.2579857/", category: "procedural_code", title: "Процессуальный кодекс (ПК)" },
  { url: "https://forum.majestic-rp.ru/threads/administrativnyi-kodeks-shtata-san-andreas.2579869/", category: "administrative_code", title: "Административный кодекс (АК)" },
  { url: "https://forum.majestic-rp.ru/threads/konstitutsiya-shtata-san-andreas.2579865/", category: "constitution", title: "Конституция (КОНСТ)" },
  { url: "https://forum.majestic-rp.ru/threads/grazhdanskii-kodeks-shtata-san-andreas.2825045/", category: "civil_code", title: "Гражданский кодекс (ГК)" },
  { url: "https://forum.majestic-rp.ru/threads/ugolovnyi-kodeks-shtata-san-andreas.2579868/", category: "criminal_code", title: "Уголовный кодекс (УК)" },
  { url: "https://forum.majestic-rp.ru/threads/trudovoi-kodeks-shtata-san-andreas.2746455/", category: "labor_code", title: "Трудовой кодекс (ТК)" },
  { url: "https://forum.majestic-rp.ru/threads/eticheskii-kodeks-shtata-san-andreas.2579871/", category: "ethics_code", title: "Этический кодекс (ЭК)" },
  
  // Законы
  { url: "https://forum.majestic-rp.ru/threads/zakon-ob-oborote-oruzhiya-boyepripasov-i-spetsial-nykh-sredstv.2825062/", category: "weapons_law", title: "Закон об обороте оружия (ЗООО)" },
  { url: "https://forum.majestic-rp.ru/threads/konstitutsionnyi-zakon-o-sudebnoi-sisteme-shtata-san-andreas.2579933/", category: "judicial_system", title: "Конституционный закон о судебной системе (КЗСС)" },
  { url: "https://forum.majestic-rp.ru/threads/konstitutsionnyi-zakon-o-senate-shtata-san-andreas.2825105/", category: "senate_law", title: "Конституционный закон о Сенате (КЗСЕН)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-deyatel-nosti-regional-nykh-pravookhranitel-nykh-organov.2579915/", category: "law_enforcement", title: "Закон о правоохранительных органах (ЗПОО)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennykh-territoriyakh-shtata-san-andreas.2709646/", category: "state_territories", title: "Закон о государственных территориях (ЗГТ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-ob-obespechenii-neprikosnovennosti-gosudarstvennykh-sluzhashchikh-shtata-san-andreas.2579888/", category: "immunity_law", title: "Закон о неприкосновенности госслужащих (ЗНГС)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-ob-advokat-skoi-deyatel-nosti-i-advokature-v-shtate-san-andreas.2579911/", category: "attorney_law", title: "Закон об адвокатской деятельности (ЗАА)" },
  { url: "https://forum.majestic-rp.ru/threads/konstitutsionnyi-zakon-o-pravitel-stve-shtata-san-andreas.2709416/", category: "government_law", title: "Конституционный закон о правительстве (КЗПР)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-deyatel-nosti-ofisa-general-nogo-prokurora-shtata-san-andreas.2579930/", category: "prosecutor_law", title: "Закон о Генеральном прокуроре (ЗГП)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-sredstvakh-massovoi-informatsii.2579924/", category: "media_law", title: "Закон о СМИ (ЗСМИ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-federal-nom-rassledovatel-skom-byuro.2579923/", category: "fib_law", title: "Закон о ФРБ (ЗФРБ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-natsional-noi-gvardii-shtata-san-andreas.2579921/", category: "national_guard", title: "Закон о Национальной гвардии (ЗНГ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-chrezvychainom-i-voyennom-polozhenii.2579918/", category: "emergency_law", title: "Закон о чрезвычайном положении (ЗЧВП)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-deyatel-nosti-sekretnoi-sluzhby-soyedinennykh-shtatov-ameriki-v-shtate-san-andreas.2579914/", category: "secret_service", title: "Закон о Секретной службе (ЗСС)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-predprinimatel-skoi-deyatel-nosti-v-shtate-san-andreas.2579910/", category: "business_law", title: "Закон о предпринимательской деятельности (ЗПД)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-sobraniyakh-mitingakh-i-publichnykh-meropriyatiyakh.2579906/", category: "assembly_law", title: "Закон о митингах (ЗМПМ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennoi-taine-v-shtate-san-andreas.2579904/", category: "state_secret", title: "Закон о государственной тайне (ЗГТАЙ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-deyatel-nosti-ekstrennoi-meditsinskoi-sluzhby-shtata-san-andreas.2579903/", category: "ems_law", title: "Закон о EMS (ЗEMS)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-politicheskikh-partiyakh-na-territorii-shtata-san-andreas.2579902/", category: "political_parties", title: "Закон о политических партиях (ЗПП)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-protivodeistvii-terrorizmu.2579901/", category: "anti_terrorism", title: "Закон о противодействии терроризму (ЗПТ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-ob-operativno-rozysknoi-deyatel-nosti.2579898/", category: "investigative_law", title: "Закон об ОРД (ЗОРД)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-ob-okhote-i-rybalke-na-territorii-shtata-san-andreas.2579895/", category: "hunting_fishing", title: "Закон об охоте и рыбалке (ЗОР)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-gosudarstvennykh-nagradakh-shtata-san-andreas.2579894/", category: "state_awards", title: "Закон о государственных наградах (ЗНАГ)" },
  { url: "https://forum.majestic-rp.ru/threads/zakon-o-sisteme-orderov-shtata-san-andreas.2579881/", category: "order_system", title: "Закон о системе ордеров (ЗОРДЕР)" },
  
  // Правила проекта
  { url: "https://forum.majestic-rp.ru/threads/osnovnyye-pravila-proyekta.8036/", category: "main_rules", title: "Основные правила проекта" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-gosudarstvennykh-organizatsii.8672/", category: "gov_org_rules", title: "Правила государственных организаций" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-dlya-liderov-fraktsii.8048/", category: "faction_leader_rules", title: "Правила для лидеров фракций" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-igrovykh-zon.8084/", category: "game_zones_rules", title: "Правила игровых зон" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-ograblenii-i-pokhishchenii.8254/", category: "robbery_rules", title: "Правила ограблений и похищений" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-perekhvata-postavok.123972/", category: "intercept_rules", title: "Правила перехвата поставок" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-voiny-za-airdrop.210836/", category: "airdrop_rules", title: "Правила войны за Airdrop" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-napadeniya-oborony-ostrova-kaio-periko.645651/", category: "cayo_perico_rules", title: "Правила нападения/обороны Кайо-Перико" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-napadeniya-oborony-territorii-forta-zankudo.8115/", category: "fort_zancudo_rules", title: "Правила нападения/обороны Форт-Занкудо" },
  { url: "https://forum.majestic-rp.ru/threads/obshchiye-pravila-semeinykh-organizatsii.1061331/", category: "family_org_rules", title: "Общие правила семейных организаций" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-zakhvata-tsekhov-dilerov.1823529/", category: "capture_rules", title: "Правила захвата цехов/дилеров" },
  
  // Дополнительные правила
  { url: "https://forum.majestic-rp.ru/threads/pravila-provedeniya-igrovykh-zakhvatov-teraktov.8843/", category: "terrorist_rules", title: "Правила проведения игровых захватов/терактов" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-ogrableniya-biznesov.8050/", category: "business_robbery_rules", title: "Правила ограбления бизнесов" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-ogrableniya-bankov.299735/", category: "bank_robbery_rules", title: "Правила ограбления банков" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-voyennogo-polozheniya.7524/", category: "martial_law_rules", title: "Правила военного положения" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-foruma.5245/", category: "forum_rules", title: "Правила форума" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-proverki-na-storonneye-po.166680/", category: "software_check_rules", title: "Правила проверки на стороннее ПО" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-i-obyazannosti-administratorov.22919/", category: "admin_rules", title: "Правила и обязанности администраторов" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-kriminal-nykh-organizatsii.3977/", category: "criminal_org_rules", title: "Правила криминальных организаций" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-voiny-za-territoriyu.32490/", category: "territory_war_rules", title: "Правила войны за территорию" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-voiny-za-materialy.8240/", category: "materials_war_rules", title: "Правила войны за материалы" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-reidov.8833/", category: "raid_rules", title: "Правила рейдов" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-predvybornoi-gonki.2573716/", category: "election_rules", title: "Правила предвыборной гонки" },
  { url: "https://forum.majestic-rp.ru/threads/pravila-napadeniya-oborony-forta-zankudo-ostrova-kaio-periko-postavok-vza-zakhvata-dillerov-i-tsekhov.2573715/", category: "combined_attack_rules", title: "Правила нападения/обороны (сводные)" },
];

interface ParseResult {
  url: string;
  title: string;
  category: string;
  success: boolean;
  content?: string;
  error?: string;
}

async function scrapeUrl(
  url: string,
  apiKey: string
): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 10000, // Wait 10 seconds for DDoS protection to pass
        timeout: 60000, // 60 second timeout
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    const markdown = data.data?.markdown || data.markdown;
    return { success: true, markdown };
  } catch (error) {
    console.error("Error scraping URL:", url, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firecrawl API key not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase configuration missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for optional specific URL in request body
    let urlsToProcess = FORUM_URLS;
    try {
      const body = await req.json();
      if (body.urls && Array.isArray(body.urls)) {
        urlsToProcess = body.urls;
      }
      if (body.category) {
        urlsToProcess = FORUM_URLS.filter((u) => u.category === body.category);
      }
    } catch {
      // No body or invalid JSON, use default URLs
    }

    console.log(`Starting forum parse for ${urlsToProcess.length} URLs...`);

    const results: ParseResult[] = [];

    for (const forumUrl of urlsToProcess) {
      console.log(`Parsing: ${forumUrl.url}`);

      const scrapeResult = await scrapeUrl(forumUrl.url, firecrawlApiKey);

      if (!scrapeResult.success || !scrapeResult.markdown) {
        results.push({
          url: forumUrl.url,
          title: forumUrl.title,
          category: forumUrl.category,
          success: false,
          error: scrapeResult.error || "No content returned",
        });
        continue;
      }

      // Upsert to database
      const { error: upsertError } = await supabase
        .from("knowledge_base")
        .upsert(
          {
            source_url: forumUrl.url,
            title: forumUrl.title,
            content: scrapeResult.markdown,
            category: forumUrl.category,
            parsed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "source_url" }
        );

      if (upsertError) {
        console.error("Error saving to database:", upsertError);
        results.push({
          url: forumUrl.url,
          title: forumUrl.title,
          category: forumUrl.category,
          success: false,
          error: `Database error: ${upsertError.message}`,
        });
      } else {
        results.push({
          url: forumUrl.url,
          title: forumUrl.title,
          category: forumUrl.category,
          success: true,
          content: `Parsed ${scrapeResult.markdown.length} characters`,
        });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(
      `Forum parse complete: ${successCount} success, ${failCount} failed`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Parsed ${successCount}/${results.length} URLs successfully`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in parse-forum function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to parse forum";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
