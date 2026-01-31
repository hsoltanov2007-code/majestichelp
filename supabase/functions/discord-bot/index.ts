import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Discord command categories mapping
const CATEGORY_MAP: Record<string, { category: string; title: string }> = {
  "ук": { category: "criminal_code", title: "Уголовный кодекс" },
  "ак": { category: "administrative_code", title: "Административный кодекс" },
  "дк": { category: "traffic_code", title: "Дорожный кодекс" },
  "пк": { category: "procedural_code", title: "Процессуальный кодекс" },
  "гк": { category: "civil_code", title: "Гражданский кодекс" },
  "тк": { category: "labor_code", title: "Трудовой кодекс" },
  "эк": { category: "ethics_code", title: "Этический кодекс" },
  "конст": { category: "constitution", title: "Конституция" },
  "зооо": { category: "weapons_law", title: "Закон об обороте оружия" },
  "кзсс": { category: "judicial_system", title: "Закон о судебной системе" },
  "зпоо": { category: "law_enforcement", title: "Закон о правоохранительных органах" },
  "знгс": { category: "immunity_law", title: "Закон о неприкосновенности госслужащих" },
  "заа": { category: "attorney_law", title: "Закон об адвокатуре" },
  "зсми": { category: "media_law", title: "Закон о СМИ" },
  "зфрб": { category: "fib_law", title: "Закон о ФРБ" },
  "знг": { category: "national_guard", title: "Закон о Национальной гвардии" },
  "зсс": { category: "secret_service", title: "Закон о Секретной службе" },
  "зems": { category: "ems_law", title: "Закон о EMS" },
  "зорд": { category: "investigative_law", title: "Закон об ОРД" },
  "зордер": { category: "order_system", title: "Закон о системе ордеров" },
};

// Parse article number from content using regex
function findArticle(content: string, articleNumber: string): string | null {
  // Clean up the article number (remove leading zeros, etc.)
  const cleanNum = articleNumber.replace(/^0+/, '') || articleNumber;
  
  // Try various article patterns
  const patterns = [
    // **Статья X.** or **Статья X.X**
    new RegExp(`\\*{2}Статья\\s+${cleanNum}(?:\\.\\d*)?\\*{2}[\\s\\S]*?(?=\\*{2}Статья\\s+\\d|$)`, 'i'),
    // Статья X. or Статья X.X (without bold)
    new RegExp(`(?:^|\\n)\\s*Статья\\s+${cleanNum}(?:\\.\\d*)?[.:]?[\\s\\S]*?(?=(?:\\n\\s*Статья\\s+\\d)|$)`, 'im'),
    // ч. X format within article
    new RegExp(`\\*{2}Статья\\s+${cleanNum}[^*]*\\*{2}[\\s\\S]*?(?=\\*{2}Статья|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      let result = match[0].trim();
      // Clean up markdown artifacts
      result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links but keep text
      result = result.replace(/!\[[^\]]*\]\([^)]+\)/g, ''); // Remove images
      if (result.length > 50) {
        return result.slice(0, 1900); // Discord limit
      }
    }
  }
  return null;
}

// Search for term in content
function searchInContent(content: string, searchTerm: string): string | null {
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  
  const index = lowerContent.indexOf(lowerTerm);
  if (index === -1) return null;
  
  // Find paragraph boundaries
  const start = Math.max(0, content.lastIndexOf('\n\n', index));
  const end = content.indexOf('\n\n', index + searchTerm.length);
  
  const excerpt = content.slice(start, end === -1 ? start + 1500 : end).trim();
  return excerpt.slice(0, 1900);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { command, query, article } = body;

    // Get command info
    const cmdInfo = CATEGORY_MAP[command?.toLowerCase()];
    
    if (!cmdInfo && !query) {
      // Return list of available commands
      const commandList = Object.entries(CATEGORY_MAP)
        .map(([cmd, info]) => `\`!${cmd}\` - ${info.title}`)
        .join('\n');
      
      return new Response(JSON.stringify({
        success: true,
        title: "📚 Доступные команды",
        content: `Используйте команды для поиска законов:\n\n${commandList}\n\n**Примеры:**\n\`!ук 105\` - Статья 105 УК\n\`!поиск угон\` - Поиск по всем законам`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Global search
    if (query) {
      const { data: allDocs } = await supabase
        .from("knowledge_base")
        .select("title, content, category")
        .eq("is_active", true);

      if (!allDocs || allDocs.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "База знаний пуста",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { title: string; excerpt: string }[] = [];
      
      for (const doc of allDocs) {
        const excerpt = searchInContent(doc.content, query);
        if (excerpt) {
          results.push({
            title: doc.title,
            excerpt: excerpt.slice(0, 500),
          });
          if (results.length >= 3) break;
        }
      }

      if (results.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `По запросу "${query}" ничего не найдено`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const content = results
        .map(r => `**${r.title}**\n${r.excerpt}...`)
        .join('\n\n---\n\n');

      return new Response(JSON.stringify({
        success: true,
        title: `🔍 Результаты поиска: "${query}"`,
        content: content.slice(0, 1900),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch specific law
    const { data: doc } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("category", cmdInfo.category)
      .eq("is_active", true)
      .single();

    if (!doc) {
      return new Response(JSON.stringify({
        success: false,
        error: `${cmdInfo.title} не найден в базе знаний`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If article number provided, find it
    if (article) {
      const articleContent = findArticle(doc.content, article);
      
      if (!articleContent) {
        return new Response(JSON.stringify({
          success: false,
          error: `Статья ${article} не найдена в ${cmdInfo.title}`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        title: `📜 ${cmdInfo.title} - Статья ${article}`,
        content: articleContent,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return law summary (first 1500 chars)
    const summary = doc.content.slice(0, 1500);
    
    return new Response(JSON.stringify({
      success: true,
      title: `📜 ${doc.title}`,
      content: `${summary}...\n\n*Используйте \`!${command} [номер]\` для поиска конкретной статьи*`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Discord bot error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Ошибка обработки запроса",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
