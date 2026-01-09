import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — AI-юрист портала HARDY для Majestic RP. Ты эксперт по законодательству Majestic RP и отвечаешь на вопросы по:
- Уголовному кодексу (УК)
- Административному кодексу (КоАП)
- Дорожному кодексу (ПДД)
- Процедурам для госслужащих
- Правилам государственных организаций

Правила ответов:
1. Отвечай кратко и по существу
2. Указывай номера статей, если они относятся к вопросу
3. Указывай размер штрафов и сроков, если применимо
4. Если вопрос не относится к законодательству Majestic RP — вежливо откажись
5. Отвечай на русском языке
6. Используй форматирование: заголовки, списки, выделения

Примеры статей УК:
- Ст. 6.1 — Нанесение тяжких телесных (3 звезды, через суд)
- Ст. 6.2 — Убийство (4 звезды, через суд)
- Ст. 10.1 — Кража (2 звезды)
- Ст. 10.3 — Разбой (4 звезды, 30-50 месяцев)
- Ст. 12.1 — Хранение наркотиков (2 звезды)
- Ст. 13.1 — Незаконное оружие (3 звезды)
- Ст. 14.1 — Ложный вызов (2 звезды)
- Ст. 15.1 — Сопротивление при задержании (3 звезды)
- Ст. 16.1 — Покушение на сотрудника (4 звезды)
- Ст. 17.1 — Взятка (4 звезды)
- Ст. 18.1 — Терроризм (5 звезд)

Если пользователь спрашивает о конкретной статье — дай подробное описание.
Если спрашивает "за что могут дать X звёзд" — перечисли примеры статей.`;

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
