import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";
const SITE_URL = "https://majestichelp.com";
const MINI_APP_URL = "https://majestichelp.com";
const TELEGRAM_CHANNEL = "@Hardyfamq";

// ── Telegram helpers ──

async function sendMessage(token: string, chatId: number, text: string, extra: Record<string, unknown> = {}) {
  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
  return res.json();
}

async function editMessage(token: string, chatId: number, messageId: number, text: string, extra: Record<string, unknown> = {}) {
  const res = await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", ...extra }),
  });
  return res.json();
}

async function reply(token: string, chatId: number, text: string, extra: Record<string, unknown> = {}, messageId?: number) {
  if (messageId) return editMessage(token, chatId, messageId, text, extra);
  return sendMessage(token, chatId, text, extra);
}

async function answerCallback(token: string, callbackId: string, text = "") {
  await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

async function checkChannelMembership(token: string, channelId: string, userId: number): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}${token}/getChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: channelId, user_id: userId }),
  });
  const data = await res.json();
  if (!data.ok) return false;
  return ["member", "administrator", "creator"].includes(data.result?.status);
}

// ── Helpers ──

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

// ── Account linking ──

async function linkAccount(token: string, chatId: number, code: string, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data: linkCode } = await supabase
    .from("telegram_link_codes")
    .select("*")
    .eq("code", code)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!linkCode) {
    await sendMessage(token, chatId, "❌ Код недействителен или истёк. Сгенерируй новый на сайте.");
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ telegram_chat_id: chatId })
    .eq("id", linkCode.user_id);

  if (error) {
    await sendMessage(token, chatId, "❌ Ошибка привязки. Попробуй позже.");
    return false;
  }

  await supabase.from("telegram_link_codes").delete().eq("id", linkCode.id);
  await sendMessage(token, chatId,
    "✅ <b>Аккаунт успешно привязан!</b>\n\nТеперь ты можешь участвовать в розыгрышах через бота."
  );
  return true;
}

// ── Giveaway handlers ──

async function showGiveaway(token: string, chatId: number, fromUserId: number, giveawayId: string, supabase: ReturnType<typeof createClient>, messageId?: number, siteUserId?: string) {
  // Check if profile is linked
  let { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  // Auto-link if we have siteUserId from deep link
  if (!profile && siteUserId) {
    const { data: siteProfile } = await supabase
      .from("profiles")
      .select("id, telegram_chat_id")
      .eq("id", siteUserId)
      .maybeSingle();

    if (siteProfile && !siteProfile.telegram_chat_id) {
      await supabase
        .from("profiles")
        .update({ telegram_chat_id: chatId })
        .eq("id", siteUserId);
      profile = { id: siteUserId };
    } else if (siteProfile && siteProfile.telegram_chat_id === chatId) {
      profile = { id: siteUserId };
    }
  }

  if (!profile) {
    await reply(token, chatId,
      "❌ <b>Аккаунт не привязан</b>\n\n" +
      "Чтобы участвовать в розыгрыше, сначала привяжи аккаунт:\n" +
      "1. Зайди на сайт → Профиль\n" +
      "2. Нажми «Привязать Telegram»\n" +
      "3. Вернись сюда и попробуй снова",
      { reply_markup: { inline_keyboard: [[{ text: "🌐 Открыть сайт", web_app: { url: MINI_APP_URL } }]] } },
      messageId
    );
    return;
  }

  const { data: giveaway } = await supabase
    .from("giveaways")
    .select("id, title, prize, status, ends_at, description")
    .eq("id", giveawayId)
    .maybeSingle();

  if (!giveaway) {
    await reply(token, chatId, "❌ Розыгрыш не найден.", {}, messageId);
    return;
  }

  if (giveaway.status !== "active") {
    await reply(token, chatId, "❌ Этот розыгрыш уже завершён.", {}, messageId);
    return;
  }

  // Check if already participating
  const { data: existingEntry } = await supabase
    .from("giveaway_entries")
    .select("id")
    .eq("giveaway_id", giveawayId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingEntry) {
    await reply(token, chatId,
      `✅ <b>Ты уже участвуешь!</b>\n\n🎁 ${giveaway.title}\n🏆 Приз: ${giveaway.prize}\n\nЖди результатов! 🤞`,
      {},
      messageId
    );
    return;
  }

  let msg = `🎁 <b>${giveaway.title}</b>\n\n`;
  msg += `🏆 Приз: <b>${giveaway.prize}</b>\n`;
  if (giveaway.description) msg += `📝 ${truncate(giveaway.description, 200)}\n`;
  if (giveaway.ends_at) msg += `⏰ До: ${formatDate(giveaway.ends_at)}\n`;
  msg += `\n📋 <b>Условия:</b>\n`;
  msg += `1. Подписаться на канал ${TELEGRAM_CHANNEL}\n`;
  msg += `2. Нажать «Участвовать» ниже\n\n`;
  msg += `⬇️ Подпишись и нажми кнопку`;

  await reply(token, chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📢 Подписаться на канал", url: `https://t.me/${TELEGRAM_CHANNEL.replace("@", "")}` }],
        [{ text: "✅ Участвовать", callback_data: `join_${giveawayId}` }],
      ],
    },
  }, messageId);
}

async function handleJoin(token: string, chatId: number, fromUserId: number, giveawayId: string, supabase: ReturnType<typeof createClient>, messageId?: number) {
  const isMember = await checkChannelMembership(token, TELEGRAM_CHANNEL, fromUserId);

  if (!isMember) {
    await reply(token, chatId,
      `❌ <b>Ты не подписан на канал!</b>\n\nПодпишись на ${TELEGRAM_CHANNEL} и нажми «Проверить».`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📢 Подписаться на канал", url: `https://t.me/${TELEGRAM_CHANNEL.replace("@", "")}` }],
            [{ text: "🔄 Проверить подписку", callback_data: `join_${giveawayId}` }],
          ],
        },
      },
      messageId
    );
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!profile) {
    await reply(token, chatId, "❌ Аккаунт не привязан. Привяжи его на сайте.", {}, messageId);
    return;
  }

  const { data: giveaway } = await supabase
    .from("giveaways")
    .select("id, title, prize, status")
    .eq("id", giveawayId)
    .maybeSingle();

  if (!giveaway || giveaway.status !== "active") {
    await reply(token, chatId, "❌ Розыгрыш завершён или не найден.", {}, messageId);
    return;
  }

  const { data: existingEntry } = await supabase
    .from("giveaway_entries")
    .select("id")
    .eq("giveaway_id", giveawayId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingEntry) {
    await reply(token, chatId, `✅ Ты уже участвуешь в «${giveaway.title}»!`, {}, messageId);
    return;
  }

  const { error } = await supabase
    .from("giveaway_entries")
    .insert({
      giveaway_id: giveawayId,
      user_id: profile.id,
      screenshot_url: "telegram-verified",
      screenshot_urls: [],
      status: "approved",
    });

  if (error) {
    if (error.code === "23505") {
      await reply(token, chatId, "✅ Ты уже участвуешь!", {}, messageId);
    } else {
      console.error("Entry error:", error);
      await reply(token, chatId, "❌ Ошибка. Попробуй позже.", {}, messageId);
    }
    return;
  }

  await reply(token, chatId,
    `🎉 <b>Ты участвуешь в розыгрыше!</b>\n\n` +
    `🎁 ${giveaway.title}\n` +
    `🏆 Приз: <b>${giveaway.prize}</b>\n\n` +
    `⚠️ <i>Не отписывайся от канала ${TELEGRAM_CHANNEL}, иначе участие будет аннулировано!</i>\n\n` +
    `Удачи! 🍀`,
    {},
    messageId
  );
}

// ── Main handler ──

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

    // ── Callback queries ──
    if (update?.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const msgId = cb.message?.message_id;
      const data = cb.data;
      const fromUserId = cb.from?.id;

      if (!chatId) return new Response("ok", { headers: corsHeaders });

      await answerCallback(BOT_TOKEN, cb.id);

      if (data?.startsWith("join_")) {
        const giveawayId = data.replace("join_", "");
        await handleJoin(BOT_TOKEN, chatId, fromUserId, giveawayId, supabase, msgId);
      }

      return new Response("ok", { headers: corsHeaders });
    }

    // ── Messages ──
    const message = update?.message;
    if (!message?.text) return new Response("ok", { headers: corsHeaders });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const fromUserId = message.from?.id;

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length >= 2) {
        const code = parts[1];

        // Compact giveaway deep link: 64 hex chars = giveawayId (32) + userId (32) without dashes
        // Or 32 hex chars = giveawayId only
        if (/^[0-9a-f]{64}$/i.test(code)) {
          const gHex = code.slice(0, 32);
          const uHex = code.slice(32, 64);
          const gId = `${gHex.slice(0,8)}-${gHex.slice(8,12)}-${gHex.slice(12,16)}-${gHex.slice(16,20)}-${gHex.slice(20)}`;
          const siteUserId = `${uHex.slice(0,8)}-${uHex.slice(8,12)}-${uHex.slice(12,16)}-${uHex.slice(16,20)}-${uHex.slice(20)}`;
          await showGiveaway(BOT_TOKEN, chatId, fromUserId, gId, supabase, undefined, siteUserId);
          return new Response("ok", { headers: corsHeaders });
        }
        if (/^[0-9a-f]{32}$/i.test(code)) {
          const gHex = code;
          const gId = `${gHex.slice(0,8)}-${gHex.slice(8,12)}-${gHex.slice(12,16)}-${gHex.slice(16,20)}-${gHex.slice(20)}`;
          await showGiveaway(BOT_TOKEN, chatId, fromUserId, gId, supabase);
          return new Response("ok", { headers: corsHeaders });
        }

        // Legacy format: giveaway_{uuid}_{uuid}
        if (code.startsWith("giveaway_")) {
          const rawAfterPrefix = code.slice("giveaway_".length);
          const gId = rawAfterPrefix.slice(0, 36);
          const siteUserId = rawAfterPrefix.length > 37 ? rawAfterPrefix.slice(37) : undefined;
          await showGiveaway(BOT_TOKEN, chatId, fromUserId, gId, supabase, undefined, siteUserId);
          return new Response("ok", { headers: corsHeaders });
        }

        // Account linking code
        await linkAccount(BOT_TOKEN, chatId, code, supabase);
        return new Response("ok", { headers: corsHeaders });
      }

      // Plain /start
      await sendMessage(BOT_TOKEN, chatId,
        "👋 <b>Привет! Я бот Hardy Help</b>\n\n" +
        "Через меня ты можешь участвовать в розыгрышах.\n" +
        "Перейди по ссылке из условий розыгрыша на сайте, чтобы начать! 🎁\n\n" +
        "🌐 Открой сайт для подробностей 👇",
        { reply_markup: { inline_keyboard: [[{ text: "🌐 Открыть сайт", web_app: { url: MINI_APP_URL } }]] } }
      );
    } else {
      await sendMessage(BOT_TOKEN, chatId,
        "Я помогаю участвовать в розыгрышах 🎁\n\nПерейди по ссылке из условий розыгрыша на сайте.",
        { reply_markup: { inline_keyboard: [[{ text: "🌐 Открыть сайт", web_app: { url: MINI_APP_URL } }]] } }
      );
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
