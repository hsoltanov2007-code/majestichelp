import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(token: string, chatId: number, text: string, parseMode = "HTML") {
  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const update = await req.json();
    const message = update?.message;
    if (!message?.text) {
      return new Response("ok", { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const fromUser = message.from;

    // /start command — link account
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length < 2) {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          "👋 Привет! Я бот <b>Hardy Help</b>.\n\n" +
          "Чтобы привязать аккаунт, зайди на сайт → Профиль → «Привязать Telegram» и отправь мне полученный код.\n\n" +
          "Команды:\n" +
          "/ticket <i>тема</i> — создать тикет поддержки\n" +
          "/help — список команд"
        );
        return new Response("ok", { headers: corsHeaders });
      }

      const code = parts[1];

      // Find valid link code
      const { data: linkCode, error: codeError } = await supabase
        .from("telegram_link_codes")
        .select("*")
        .eq("code", code)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (codeError || !linkCode) {
        await sendTelegramMessage(BOT_TOKEN, chatId, "❌ Код недействителен или истёк. Сгенерируй новый на сайте.");
        return new Response("ok", { headers: corsHeaders });
      }

      // Link telegram chat_id to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ telegram_chat_id: chatId })
        .eq("id", linkCode.user_id);

      if (updateError) {
        await sendTelegramMessage(BOT_TOKEN, chatId, "❌ Ошибка привязки. Попробуй позже.");
        return new Response("ok", { headers: corsHeaders });
      }

      // Delete used code
      await supabase.from("telegram_link_codes").delete().eq("id", linkCode.id);

      await sendTelegramMessage(BOT_TOKEN, chatId,
        "✅ Аккаунт успешно привязан! Теперь ты будешь получать уведомления в Telegram."
      );
      return new Response("ok", { headers: corsHeaders });
    }

    // /ticket command — create support ticket
    if (text.startsWith("/ticket")) {
      const subject = text.replace("/ticket", "").trim();
      if (!subject) {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          "Используй: /ticket <i>тема обращения</i>\n\nПример: /ticket Не могу войти в аккаунт"
        );
        return new Response("ok", { headers: corsHeaders });
      }

      // Find user by telegram_chat_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (!profile) {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          "❌ Сначала привяжи аккаунт. Зайди на сайт → Профиль → «Привязать Telegram»."
        );
        return new Response("ok", { headers: corsHeaders });
      }

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({ user_id: profile.id, subject })
        .select()
        .single();

      if (ticketError) {
        await sendTelegramMessage(BOT_TOKEN, chatId, "❌ Ошибка создания тикета. Попробуй позже.");
        return new Response("ok", { headers: corsHeaders });
      }

      // Create first message
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: profile.id,
        content: `[Создано из Telegram] ${subject}`,
        is_admin: false,
      });

      await sendTelegramMessage(BOT_TOKEN, chatId,
        `✅ Тикет создан!\n\n📋 Тема: <b>${subject}</b>\n\nОтветы администраторов придут сюда.`
      );
      return new Response("ok", { headers: corsHeaders });
    }

    // /help command
    if (text.startsWith("/help")) {
      await sendTelegramMessage(BOT_TOKEN, chatId,
        "📖 <b>Команды Hardy Help бота:</b>\n\n" +
        "/start — привязка аккаунта\n" +
        "/ticket <i>тема</i> — создать тикет поддержки\n" +
        "/help — список команд\n\n" +
        "После привязки аккаунта ты будешь получать уведомления о событиях на сайте."
      );
      return new Response("ok", { headers: corsHeaders });
    }

    // Check if this is a reply to a ticket notification — forward as ticket message
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (profile) {
      // Find latest open ticket for this user
      const { data: latestTicket } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("user_id", profile.id)
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestTicket) {
        await supabase.from("support_messages").insert({
          ticket_id: latestTicket.id,
          sender_id: profile.id,
          content: `[Telegram] ${text}`,
          is_admin: false,
        });

        await sendTelegramMessage(BOT_TOKEN, chatId, "✅ Сообщение отправлено в тикет поддержки.");
        return new Response("ok", { headers: corsHeaders });
      }
    }

    await sendTelegramMessage(BOT_TOKEN, chatId,
      "Не понял команду. Напиши /help для списка команд."
    );
    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
