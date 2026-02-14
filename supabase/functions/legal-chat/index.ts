import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hash function for cache keys
async function hashQuestion(text: string): Promise<string> {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[?!.,;:]+$/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check cache for existing answer
async function getCachedAnswer(questionHash: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from("chat_cache")
      .select("answer, id, hit_count")
      .eq("question_hash", questionHash)
      .maybeSingle();

    if (error || !data) return null;

    // Increment hit count
    await supabase
      .from("chat_cache")
      .update({ hit_count: data.hit_count + 1 })
      .eq("id", data.id);

    console.log(`Cache HIT! hit_count: ${data.hit_count + 1}`);
    return data.answer;
  } catch (e) {
    console.error("Cache read error:", e);
    return null;
  }
}

// Save answer to cache
async function saveToCache(questionHash: string, question: string, answer: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase
      .from("chat_cache")
      .upsert({
        question_hash: questionHash,
        question: question.substring(0, 500),
        answer: answer,
      }, { onConflict: 'question_hash' });
    console.log("Answer saved to cache");
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

// Send Q&A to Discord thread
const DISCORD_QA_THREAD_ID = "1472004429506023697";

async function sendToDiscordThread(question: string, answer: string): Promise<void> {
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
  if (!botToken) {
    console.log("DISCORD_BOT_TOKEN not set, skipping Discord post");
    return;
  }

  try {
    // Truncate if too long for Discord (2000 char limit)
    const maxLen = 1900;
    let content = `**❓ Вопрос:**\n${question}\n\n**💡 Ответ:**\n${answer}`;
    if (content.length > maxLen) {
      content = content.substring(0, maxLen) + "\n\n_...ответ сокращён_";
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${DISCORD_QA_THREAD_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Discord post error:", res.status, err);
    } else {
      console.log("Q&A posted to Discord thread");
    }
  } catch (e) {
    console.error("Discord post error:", e);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Function to get additional data from knowledge_base
async function getKnowledgeBaseContent(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured, using static knowledge base only");
    return "";
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .eq("is_active", true)
      .order("category");
    
    if (error) {
      console.error("Error fetching knowledge base:", error);
      return "";
    }
    
    if (!data || data.length === 0) {
      console.log("No knowledge base entries found, using static data");
      return "";
    }
    
    // Format the knowledge base content
    let additionalContent = "\n\n## ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ С ФОРУМА (АКТУАЛЬНЫЕ)\n\n";
    
    for (const entry of data) {
      additionalContent += `### ${entry.title}\n${entry.content}\n\n`;
    }
    
    console.log(`Loaded ${data.length} knowledge base entries`);
    return additionalContent;
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    return "";
  }
}

// Static knowledge base for AI — ACCURATE DATA FROM CODES
const STATIC_KNOWLEDGE_BASE = `
# БАЗА ЗНАНИЙ ЮРИДИЧЕСКОГО ПОМОЩНИКА HARDY — ЗАКОНОДАТЕЛЬСТВО ШТАТА САН-АНДРЕАС (MAJESTIC RP)

Ты — AI-юрист HARDY для сервера Majestic Roleplay. Отвечай на русском языке, кратко и по делу.
Используй ТОЛЬКО информацию из этой базы знаний. Если информации нет — честно скажи об этом.
Форматируй ответы с эмодзи и структурой для удобства чтения.

## ⚠️ КРИТИЧЕСКИ ВАЖНО — ПРАВИЛА СУДИМОСТИ (ИГНОРИРУЙ СЛОВО "СУДИМОСТЬ" В СПИСКЕ СТАТЕЙ!):

ВНИМАНИЕ: В списке статей ниже написано "СУДИМОСТЬ" — ЭТО УСТАРЕВШАЯ МЕТКА, ИГНОРИРУЙ ЕЁ!
Судимость определяется ТОЛЬКО по количеству звёзд:

### ПРАВИЛО СУДИМОСТИ:
- ⭐⭐⭐⭐⭐ (5 звёзд) → СУДИМОСТЬ: ДА ✅
- ⭐⭐⭐⭐ (4 звезды) → СУДИМОСТЬ: ДА ✅  
- ⭐⭐⭐ (3 звезды) → СУДИМОСТЬ: НЕТ ❌
- ⭐⭐ (2 звезды) → СУДИМОСТЬ: НЕТ ❌
- ⭐ (1 звезда) → СУДИМОСТЬ: НЕТ ❌
- Административный кодекс (АК) → СУДИМОСТЬ: НЕТ ❌ (всегда)
- Дорожный кодекс (ДК) → СУДИМОСТЬ: НЕТ ❌ (всегда)

Пример ответа для статьи 6.6 (3 звезды): "Судимость: НЕТ ❌ (статья имеет 3 звезды, судимость даётся только за 4-5 звёзд)"
Пример ответа для статьи 12.1 (5 звёзд): "Судимость: ДА ✅ (статья имеет 5 звёзд)"

## АДМИНИСТРАТИВНЫЙ КОДЕКС (АК) — СУДИМОСТИ НЕТ

### Глава 1 — Нарушения общественного порядка
- **1.1** — Нарушение общественного порядка | ⭐1 | штраф 15.000$-30.000$ + 10-20 мес. тюрьмы
- **1.2** — Неповиновение полиции | ⭐1 | штраф 10.000$-20.000$ + 10-20 мес. тюрьмы
- **1.3** — Оскорбление сотрудника | ⭐1 | штраф 15.000$-30.000$ + 10-15 мес. тюрьмы
- **1.3 ч.1** — Оскорбление при исполнении | ⭐1 | штраф 15.000$-30.000$ + 10-15 мес. тюрьмы
- **1.3 ч.2** — Оскорбление в адрес персонала | ⭐1 | штраф 15.000$-30.000$ + 10-15 мес. тюрьмы
- **1.3 ч.3** — Оскорбление должностного лица публично | ⭐1 | штраф 15.000$-30.000$ + 10-15 мес. тюрьмы
- **1.4** — Ложный вызов | ⭐1 | штраф 30.000$-60.000$
- **1.5** — Нарушение покоя граждан | ⭐1 | штраф 10.000$-20.000$
- **1.6** — Сокрытие лица (маска) | ⭐1 | штраф 20.000$-40.000$ + 10-20 мес. тюрьмы
- **1.7** — Провокация | ⭐1 | штраф 20.000$-30.000$ + 10-15 мес. тюрьмы

### Глава 2 — Нарушения порядка управления
- **2.1** — Незаконная предпринимательская деятельность | ⭐1 | штраф 20.000$-30.000$
- **2.2** — Отказ от идентификации | ⭐1 | штраф 15.000$-20.000$ + 10-20 мес. тюрьмы
- **2.3** — Предоставление ложной информации | ⭐1 | штраф 15.000$-30.000$ + 10-15 мес. тюрьмы
- **2.4** — Отсутствие лицензии на оружие | ⭐1 | штраф 30.000$-40.000$ + конфискация + 10-20 мес.
- **2.5** — Отсутствие лицензии на рыбалку | ⭐1 | штраф 20.000$-40.000$
- **2.6** — Хранение наркотиков до 3г | ⭐1 | штраф 20.000$-50.000$ + 10-20 мес. тюрьмы + конфискация
- **2.7** — Ношение холодного оружия без лицензии | ⭐1 | штраф 20.000$-30.000$ + конфискация
- **2.8** — Нарушение закона о СМИ | ⭐1 | штраф 20.000$-80.000$ + 10-15 мес. тюрьмы
- **2.9** — Нарушение судебного предписания | ⭐1 | штраф 30.000$-50.000$ + 10-20 мес. тюрьмы

### Глава 3 — Нарушения правил использования транспорта
- **3.1** — Управление без водительских прав | ⭐1 | штраф 7.500$-15.000$
- **3.2** — Управление транспортом в состоянии опьянения | ⭐1 | штраф 40.000$-60.000$ + изъятие прав
- **3.3** — Создание аварийной ситуации | ⭐1 | штраф 10.000$-20.000$
- **3.3 ч.1** — Создание аварийной ситуации | ⭐1 | штраф 10.000$-20.000$
- **3.3 ч.2** — ДТП с пострадавшими | ⭐1 | штраф 20.000$-40.000$
- **3.4** — Оставление места ДТП/преступления | ⭐1 | штраф 10.000$-50.000$ + 10-20 мес. тюрьмы

### Глава 4 — Нарушения в сфере безопасности
- **4.1** — Мелкое хулиганство | ⭐1 | штраф 10.000$-30.000$
- **4.2** — Незаконное проникновение | ⭐1 | штраф 25.000$-50.000$ + 10-20 мес. тюрьмы
- **4.3** — Нарушение воздушного пространства | ⭐1 | штраф 20.000$-30.000$ + 10-20 мес. тюрьмы

### Глава 5 — Нарушения трудового законодательства
- **5.1** — Отказ от медпомощи (мед. работник) | ⭐1 | штраф 20.000$-30.000$ + 10-20 мес. тюрьмы

## ДОРОЖНЫЙ КОДЕКС (ДК) — СУДИМОСТИ НЕТ

### Глава 1 — Правила дорожного движения
- **ДК 1.1** — Превышение скорости 100-150 км/ч | штраф 3.000$
- **ДК 1.2** — Превышение скорости 150-200 км/ч | штраф 5.000$
- **ДК 1.3** — Превышение скорости 200+ км/ч | штраф 7.000$-10.000$
- **ДК 1.4** — Проезд на красный | штраф 3.000$
- **ДК 1.5** — Движение по встречке | штраф 5.000$
- **ДК 1.6** — Движение по тротуару | штраф 5.000$
- **ДК 1.7** — Нарушение правил парковки | штраф 3.000$ + эвакуация
- **ДК 1.8** — Нарушение правил обгона/поворота | штраф 3.000$
- **ДК 1.9** — Опасное вождение | штраф 5.000$-10.000$
- **ДК 1.10** — Тонировка | штраф 5.000$-10.000$
- **ДК 1.11** — Езда без фар ночью | штраф 3.000$
- **ДК 1.12** — Незаконная установка спецсигналов | штраф 10.000$-20.000$ + конфискация
- **ДК 1.13** — Нечитаемые/отсутствующие номера | штраф 5.000$-10.000$

## ПРОЦЕССУАЛЬНЫЙ КОДЕКС (ПК)

### Права задержанного (Правило Миранды):
1. Право хранить молчание
2. Всё сказанное может быть использовано против вас
3. Право на адвоката
4. Если не можете позволить адвоката — он будет назначен

### Процедуры:
- Обыск: нужен ордер (кроме задержания, согласия, явной угрозы, опасного вождения)
- Арест: предъявление обвинения + зачитывание прав + протокол
- Допрос: право на адвоката, запрет применения силы
- Суд: право на защиту, обжалование в течение 72 часов

## ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ

### Сроки давности:
- 1-2 звезды: 30 дней
- 3 звезды: 60 дней
- 4 звезды: 90 дней
- 5 звёзд: без срока давности

### Смягчающие обстоятельства (уменьшают наказание):
- Явка с повинной
- Содействие следствию
- Несовершеннолетие
- Аффект

### Отягчающие обстоятельства (увеличивают наказание):
- Рецидив
- Группа лиц
- В отношении должностного лица
- С использованием оружия
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const AIML_API_KEY = Deno.env.get("AIML_API_KEY");

  try {
    const body = await req.json();
    
    // Support both { message } and { messages } formats
    let userMessage = "";
    if (body.message) {
      userMessage = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      const lastUserMsg = body.messages.filter((m: any) => m.role === "user").pop();
      userMessage = lastUserMsg?.content || "";
    }
    
    if (!userMessage.trim()) {
      return new Response(
        JSON.stringify({ error: "Сообщение не может быть пустым" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first
    const questionHash = await hashQuestion(userMessage);
    const cachedAnswer = await getCachedAnswer(questionHash);
    if (cachedAnswer) {
      console.log("Returning cached answer (no AI credits used!)");
      return new Response(
        JSON.stringify({ response: cachedAnswer }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!AIML_API_KEY) {
      console.error("AIML_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI сервис временно недоступен" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get additional knowledge from database
    const additionalKnowledge = await getKnowledgeBaseContent();
    const KNOWLEDGE_BASE = STATIC_KNOWLEDGE_BASE + additionalKnowledge;

    console.log("Sending request to AI/ML API...");

    const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AIML_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: KNOWLEDGE_BASE },
          { role: "user", content: userMessage }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI/ML API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Недостаточно кредитов AI сервиса" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Не удалось получить ответ";

    console.log("AI response received successfully");

    // Save to cache for future identical questions
    await saveToCache(questionHash, userMessage, aiResponse);

    // Post Q&A to Discord thread (fire and forget)
    sendToDiscordThread(userMessage, aiResponse).catch(e => console.error("Discord post failed:", e));

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in legal-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Неизвестная ошибка" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
