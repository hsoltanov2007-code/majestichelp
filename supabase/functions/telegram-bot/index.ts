import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";
const SITE_URL = "https://majestichelp.com";
const MINI_APP_URL = "https://majestichelp.com";

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
  if (messageId) {
    return editMessage(token, chatId, messageId, text, extra);
  }
  return sendMessage(token, chatId, text, extra);
}

async function answerCallback(token: string, callbackId: string, text = "") {
  await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

// ── Main menu keyboard ──

function mainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🚀 Открыть приложение", web_app: { url: MINI_APP_URL } },
        ],
        [
          { text: "📚 Поиск законов", callback_data: "menu_law" },
          { text: "🎁 Розыгрыши", callback_data: "menu_giveaways" },
        ],
        [
          { text: "🎫 Мои тикеты", callback_data: "menu_tickets" },
          { text: "📰 Новости", callback_data: "menu_news" },
        ],
        [
          { text: "👤 Профиль", callback_data: "menu_profile" },
          { text: "❓ Помощь", callback_data: "menu_help" },
        ],
      ],
    },
  };
}

// ── Helpers ──

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

const statusEmoji: Record<string, string> = {
  open: "🟢",
  closed: "🔴",
  resolved: "✅",
};

// ── Command handlers ──

async function handleStart(token: string, chatId: number, text: string, supabase: ReturnType<typeof createClient>) {
  const parts = text.split(" ");
  if (parts.length >= 2) {
    const code = parts[1];
    const { data: linkCode } = await supabase
      .from("telegram_link_codes")
      .select("*")
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!linkCode) {
      await sendMessage(token, chatId, "❌ Код недействителен или истёк. Сгенерируй новый на сайте.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ telegram_chat_id: chatId })
      .eq("id", linkCode.user_id);

    if (error) {
      await sendMessage(token, chatId, "❌ Ошибка привязки. Попробуй позже.");
      return;
    }

    await supabase.from("telegram_link_codes").delete().eq("id", linkCode.id);
    await sendMessage(token, chatId,
      "✅ <b>Аккаунт успешно привязан!</b>\n\n" +
      "Теперь ты будешь получать уведомления в Telegram.\n" +
      "Используй меню ниже для навигации 👇",
      mainMenuKeyboard()
    );
    return;
  }

  await sendMessage(token, chatId,
    "👋 <b>Привет! Я бот Hardy Help</b>\n\n" +
    "🔹 Нажми кнопку ниже, чтобы открыть полное приложение прямо в Telegram\n" +
    "🔹 Поиск законов, розыгрыши, тикеты, новости\n" +
    "🔹 Авторизация происходит автоматически через Telegram\n\n" +
    "Выбери действие 👇",
    mainMenuKeyboard()
  );
}

async function handleLaw(token: string, chatId: number, query: string, supabase: ReturnType<typeof createClient>, messageId?: number) {
  if (!query) {
    await reply(token, chatId,
      "📚 <b>Поиск законов</b>\n\n" +
      "Используй: <code>/law запрос</code>\n\n" +
      "Примеры:\n" +
      "• <code>/law ук 228</code>\n" +
      "• <code>/law дорожный кодекс</code>\n" +
      "• <code>/law грабёж</code>",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  const searchTerm = `%${query}%`;
  const { data: laws } = await supabase
    .from("laws")
    .select("title, short_title, content, type, slug")
    .or(`title.ilike.${searchTerm},short_title.ilike.${searchTerm},content.ilike.${searchTerm}`)
    .limit(3);

  if (!laws?.length) {
    await reply(token, chatId,
      `🔍 По запросу «<b>${query}</b>» ничего не найдено.\n\nПопробуй другой запрос.`,
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  let msg = `📚 <b>Результаты по «${query}»:</b>\n\n`;
  laws.forEach((law, i) => {
    msg += `<b>${i + 1}. ${law.title}</b>\n`;
    msg += `📎 <i>${law.short_title}</i>\n`;
    msg += `${truncate(law.content.replace(/<[^>]+>/g, ""), 200)}\n`;
    msg += `🔗 <a href="${SITE_URL}/laws/${law.slug}">Читать полностью</a>\n\n`;
  });

  await reply(token, chatId, msg, {
    reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] },
    disable_web_page_preview: true,
  }, messageId);
}

async function handleProfile(token: string, chatId: number, supabase: ReturnType<typeof createClient>, messageId?: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!profile) {
    await reply(token, chatId,
      "❌ Аккаунт не привязан.\n\nЗайди на сайт → Профиль → «Привязать Telegram».",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", profile.id);

  const { count: ticketCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "open");

  const { count: giveawayCount } = await supabase
    .from("giveaway_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const roleList = roles?.map(r => r.role).join(", ") || "user";

  const msg =
    `👤 <b>Профиль</b>\n\n` +
    `📛 <b>Имя:</b> ${profile.username}\n` +
    `🏷 <b>Роли:</b> ${roleList}\n` +
    `🎫 <b>Открытых тикетов:</b> ${ticketCount ?? 0}\n` +
    `🎁 <b>Участий в розыгрышах:</b> ${giveawayCount ?? 0}\n` +
    `📅 <b>На сайте с:</b> ${formatDate(profile.created_at)}\n\n` +
    `🔗 <a href="${SITE_URL}/profile">Открыть профиль</a>`;

  await reply(token, chatId, msg, {
    reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] },
    disable_web_page_preview: true,
  }, messageId);
}

async function handleGiveaways(token: string, chatId: number, supabase: ReturnType<typeof createClient>, messageId?: number) {
  const { data: giveaways } = await supabase
    .from("giveaways")
    .select("title, prize, ends_at, description")
    .eq("status", "active")
    .order("ends_at", { ascending: true })
    .limit(5);

  if (!giveaways?.length) {
    await reply(token, chatId,
      "🎁 Сейчас нет активных розыгрышей.\n\nСледи за новостями!",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  let msg = "🎁 <b>Активные розыгрыши:</b>\n\n";
  giveaways.forEach((g, i) => {
    msg += `<b>${i + 1}. ${g.title}</b>\n`;
    msg += `🏆 Приз: <b>${g.prize}</b>\n`;
    if (g.ends_at) msg += `⏰ До: ${formatDate(g.ends_at)}\n`;
    if (g.description) msg += `📝 ${truncate(g.description, 100)}\n`;
    msg += `\n`;
  });
  msg += `🔗 <a href="${SITE_URL}/giveaways">Участвовать на сайте</a>`;

  await reply(token, chatId, msg, {
    reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] },
    disable_web_page_preview: true,
  }, messageId);
}

async function handleTickets(token: string, chatId: number, supabase: ReturnType<typeof createClient>, messageId?: number) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!profile) {
    await reply(token, chatId,
      "❌ Сначала привяжи аккаунт.\nЗайди на сайт → Профиль → «Привязать Telegram».",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, status, created_at, updated_at")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (!tickets?.length) {
    await reply(token, chatId,
      "🎫 У тебя нет тикетов.\n\nСоздай новый: <code>/ticket тема обращения</code>",
      { reply_markup: { inline_keyboard: [[{ text: "➕ Создать тикет", callback_data: "menu_ticket_new" }, { text: "◀️ Меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  let msg = "🎫 <b>Мои тикеты:</b>\n\n";
  tickets.forEach((t, i) => {
    const emoji = statusEmoji[t.status] || "⚪";
    msg += `${emoji} <b>${i + 1}. ${t.subject}</b>\n`;
    msg += `   Статус: ${t.status} | ${formatDate(t.updated_at)}\n\n`;
  });
  msg += "<i>Ответь сообщением, чтобы дополнить последний открытый тикет.</i>";

  await reply(token, chatId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Создать тикет", callback_data: "menu_ticket_new" }],
        [{ text: "◀️ Главное меню", callback_data: "menu_main" }],
      ],
    },
  }, messageId);
}

async function handleNews(token: string, chatId: number, supabase: ReturnType<typeof createClient>, messageId?: number) {
  const { data: news } = await supabase
    .from("discord_news")
    .select("title, content, created_at, author_name")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!news?.length) {
    await reply(token, chatId,
      "📰 Новостей пока нет.",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
      messageId
    );
    return;
  }

  let msg = "📰 <b>Последние новости:</b>\n\n";
  news.forEach((n, i) => {
    const title = n.title || `Новость от ${n.author_name}`;
    msg += `<b>${i + 1}. ${title}</b>\n`;
    msg += `📅 ${formatDate(n.created_at)}\n`;
    msg += `${truncate(n.content.replace(/<[^>]+>/g, ""), 150)}\n\n`;
  });
  msg += `🔗 <a href="${SITE_URL}/news">Все новости на сайте</a>`;

  await reply(token, chatId, msg, {
    reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] },
    disable_web_page_preview: true,
  }, messageId);
}

async function handleHelp(token: string, chatId: number, messageId?: number) {
  await reply(token, chatId,
    "📖 <b>Команды Hardy Help бота:</b>\n\n" +
    "📚 /law <i>запрос</i> — поиск законов\n" +
    "👤 /profile — мой профиль\n" +
    "🎁 /giveaways — активные розыгрыши\n" +
    "🎫 /tickets — мои тикеты\n" +
    "📰 /news — последние новости\n" +
    "🎫 /ticket <i>тема</i> — создать тикет\n" +
    "❓ /help — эта справка\n\n" +
    "Или используй кнопки меню 👇",
    mainMenuKeyboard(),
    messageId
  );
}

async function handleTicketCreate(token: string, chatId: number, subject: string, supabase: ReturnType<typeof createClient>) {
  if (!subject) {
    await sendMessage(token, chatId,
      "🎫 <b>Создание тикета</b>\n\n" +
      "Используй: <code>/ticket тема обращения</code>\n\n" +
      "Пример: <code>/ticket Не могу войти в аккаунт</code>",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } }
    );
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!profile) {
    await sendMessage(token, chatId,
      "❌ Сначала привяжи аккаунт.\nЗайди на сайт → Профиль → «Привязать Telegram».",
      { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } }
    );
    return;
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: profile.id, subject })
    .select()
    .single();

  if (error) {
    await sendMessage(token, chatId, "❌ Ошибка создания тикета. Попробуй позже.");
    return;
  }

  await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_id: profile.id,
    content: `[Создано из Telegram] ${subject}`,
    is_admin: false,
  });

  await sendMessage(token, chatId,
    `✅ <b>Тикет создан!</b>\n\n📋 Тема: <b>${subject}</b>\n\nОтветы администраторов придут сюда.`,
    { reply_markup: { inline_keyboard: [[{ text: "🎫 Мои тикеты", callback_data: "menu_tickets" }, { text: "◀️ Меню", callback_data: "menu_main" }]] } }
  );
}

async function handleFreeText(token: string, chatId: number, text: string, supabase: ReturnType<typeof createClient>) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (profile) {
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
      await sendMessage(token, chatId,
        "✅ Сообщение отправлено в тикет поддержки.",
        { reply_markup: { inline_keyboard: [[{ text: "🎫 Мои тикеты", callback_data: "menu_tickets" }, { text: "◀️ Меню", callback_data: "menu_main" }]] } }
      );
      return;
    }
  }

  await sendMessage(token, chatId,
    "Не понял команду 🤔\nИспользуй меню или напиши /help",
    mainMenuKeyboard()
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

    // ── Handle callback_query (inline button presses) ──
    if (update?.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const msgId = cb.message?.message_id;
      const data = cb.data;

      if (!chatId) return new Response("ok", { headers: corsHeaders });

      await answerCallback(BOT_TOKEN, cb.id);

      switch (data) {
        case "menu_main":
          await reply(BOT_TOKEN, chatId, "📋 <b>Главное меню</b>\n\nВыбери действие 👇", mainMenuKeyboard(), msgId);
          break;
        case "menu_law":
          await handleLaw(BOT_TOKEN, chatId, "", supabase, msgId);
          break;
        case "menu_profile":
          await handleProfile(BOT_TOKEN, chatId, supabase, msgId);
          break;
        case "menu_giveaways":
          await handleGiveaways(BOT_TOKEN, chatId, supabase, msgId);
          break;
        case "menu_tickets":
          await handleTickets(BOT_TOKEN, chatId, supabase, msgId);
          break;
        case "menu_news":
          await handleNews(BOT_TOKEN, chatId, supabase, msgId);
          break;
        case "menu_help":
          await handleHelp(BOT_TOKEN, chatId, msgId);
          break;
        case "menu_ticket_new":
          await reply(BOT_TOKEN, chatId,
            "🎫 Для создания тикета отправь:\n<code>/ticket тема обращения</code>",
            { reply_markup: { inline_keyboard: [[{ text: "◀️ Главное меню", callback_data: "menu_main" }]] } },
            msgId
          );
          break;
        default:
          await reply(BOT_TOKEN, chatId, "📋 Выбери действие 👇", mainMenuKeyboard(), msgId);
      }
      return new Response("ok", { headers: corsHeaders });
    }

    // ── Handle messages ──
    const message = update?.message;
    if (!message?.text) {
      return new Response("ok", { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith("/start")) {
      await handleStart(BOT_TOKEN, chatId, text, supabase);
    } else if (text.startsWith("/law")) {
      await handleLaw(BOT_TOKEN, chatId, text.replace("/law", "").trim(), supabase);
    } else if (text.startsWith("/profile")) {
      await handleProfile(BOT_TOKEN, chatId, supabase);
    } else if (text.startsWith("/giveaways")) {
      await handleGiveaways(BOT_TOKEN, chatId, supabase);
    } else if (text.startsWith("/tickets")) {
      await handleTickets(BOT_TOKEN, chatId, supabase);
    } else if (text.startsWith("/news")) {
      await handleNews(BOT_TOKEN, chatId, supabase);
    } else if (text.startsWith("/ticket")) {
      await handleTicketCreate(BOT_TOKEN, chatId, text.replace("/ticket", "").trim(), supabase);
    } else if (text.startsWith("/help")) {
      await handleHelp(BOT_TOKEN, chatId);
    } else {
      await handleFreeText(BOT_TOKEN, chatId, text, supabase);
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
