import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Forum URLs to parse - Majestic RP законодательство
const FORUM_URLS = [
  // Уголовный кодекс
  {
    url: "https://forum.majestic-rp.ru/threads/ugolovnyj-kodeks.60/",
    category: "criminal_code",
    title: "Уголовный кодекс",
  },
  // Административный кодекс  
  {
    url: "https://forum.majestic-rp.ru/threads/administrativnyj-kodeks.61/",
    category: "administrative_code",
    title: "Административный кодекс",
  },
  // Дорожный кодекс
  {
    url: "https://forum.majestic-rp.ru/threads/dorozhnyj-kodeks.62/",
    category: "traffic_code",
    title: "Дорожный кодекс",
  },
  // Конституция
  {
    url: "https://forum.majestic-rp.ru/threads/konstitucija.57/",
    category: "constitution",
    title: "Конституция",
  },
  // Правила государственных организаций
  {
    url: "https://forum.majestic-rp.ru/threads/pravila-gosudarstvennyx-organizacij.59/",
    category: "government_rules",
    title: "Правила государственных организаций",
  },
  // Трудовой кодекс
  {
    url: "https://forum.majestic-rp.ru/threads/trudovoj-kodeks.58/",
    category: "labor_code",
    title: "Трудовой кодекс",
  },
  // Процессуальный кодекс
  {
    url: "https://forum.majestic-rp.ru/threads/processualnyj-kodeks.63/",
    category: "procedural_code",
    title: "Процессуальный кодекс",
  },
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
