# Hardy Laws Discord Bot — Full Version

## Установка

```bash
pip install discord.py aiohttp python-dotenv
```

## Файл `.env`

```env
DISCORD_TOKEN=MTQ2NzE5NzI0NjM2NDg0NDE2NA.xxx.xxx
SUPABASE_URL=https://irdylmsqtnsgdlmoqqof.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHlsbXNxdG5zZ2RsbW9xcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTAxOTMsImV4cCI6MjA4MTY2NjE5M30.4k3pysKDUfqrjlqOPlmXTw9DEbC2IRHKwRC0XCJ9PNY

# Опционально
SESSION_PREFIX=hardy-session-
SESSION_TTL_HOURS=6
COOLDOWN_SECONDS=2
MAX_SESSIONS_PER_USER=1
ADMIN_USER_IDS=
ADMIN_ROLE_IDS=
```

## Код бота `bot.py`

```python
import asyncio
import logging
import os
import re
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

# =========================
# CONFIG
# =========================
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
API_URL = f"{SUPABASE_URL}/functions/v1/discord-bot"

SESSION_PREFIX = os.getenv("SESSION_PREFIX", "hardy-session-").strip()
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "6"))
COOLDOWN_SECONDS = float(os.getenv("COOLDOWN_SECONDS", "2"))
MAX_SESSIONS_PER_USER = int(os.getenv("MAX_SESSIONS_PER_USER", "1"))

ADMIN_ROLE_IDS = [int(x) for x in os.getenv("ADMIN_ROLE_IDS", "").split(",") if x.strip().isdigit()]
ADMIN_USER_IDS = [int(x) for x in os.getenv("ADMIN_USER_IDS", "").split(",") if x.strip().isdigit()]

SQLITE_PATH = Path(os.getenv("SQLITE_PATH", "bot_storage.sqlite3"))

# =========================
# LOGGING
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("hardy_bot")

# =========================
# DISCORD SETUP
# =========================
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

# =========================
# LAW COMMANDS MAP
# =========================
LAW_COMMANDS = {
    'ук': 'Уголовный кодекс',
    'ак': 'Административный кодекс',
    'дк': 'Дорожный кодекс',
    'пк': 'Процессуальный кодекс',
    'гк': 'Гражданский кодекс',
    'тк': 'Трудовой кодекс',
    'эк': 'Этический кодекс',
    'конст': 'Конституция',
    'зооо': 'Закон об обороте оружия',
    'кзсс': 'Закон о судебной системе',
    'кзсен': 'Закон о Сенате',
    'зпоо': 'Закон о правоохранительных органах',
    'згт': 'Закон о государственных территориях',
    'знгс': 'Закон о неприкосновенности госслужащих',
    'заа': 'Закон об адвокатуре',
    'кзпр': 'Закон о правительстве',
    'згп': 'Закон о Генеральном прокуроре',
    'зсми': 'Закон о СМИ',
    'зфрб': 'Закон о ФРБ',
    'знг': 'Закон о Национальной гвардии',
    'зчвп': 'Закон о чрезвычайном положении',
    'зсс': 'Закон о Секретной службе',
    'зпд': 'Закон о предпринимательстве',
    'змпм': 'Закон о митингах',
    'згтай': 'Закон о государственной тайне',
    'зems': 'Закон о EMS',
    'зпп': 'Закон о политических партиях',
    'зпт': 'Закон о противодействии терроризму',
    'зорд': 'Закон об ОРД',
    'зор': 'Закон об охоте и рыбалке',
    'знаг': 'Закон о государственных наградах',
    'зордер': 'Закон о системе ордеров',
}

# =========================
# API CLIENT
# =========================
async def call_api(data: dict) -> dict:
    """Вызов API для получения информации о законах"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(API_URL, json=data, headers=headers, timeout=30) as response:
                return await response.json()
    except Exception as e:
        log.exception("API call failed")
        return {"success": False, "error": str(e)}

# =========================
# STORAGE (SQLite)
# =========================
def db_connect() -> sqlite3.Connection:
    con = sqlite3.connect(SQLITE_PATH)
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    return con

def db_init() -> None:
    con = db_connect()
    with con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                user_id INTEGER NOT NULL,
                code TEXT NOT NULL,
                article TEXT NOT NULL,
                title TEXT,
                added_ts INTEGER NOT NULL,
                PRIMARY KEY (user_id, code, article)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS history (
                user_id INTEGER NOT NULL,
                ts INTEGER NOT NULL,
                query TEXT NOT NULL,
                code_filter TEXT,
                kind TEXT
            )
        """)
    con.close()

def hist_add(user_id: int, query: str, code_filter: Optional[str], kind: str) -> None:
    con = db_connect()
    with con:
        con.execute(
            "INSERT INTO history(user_id, ts, query, code_filter, kind) VALUES(?,?,?,?,?)",
            (user_id, int(time.time()), query, code_filter, kind),
        )
        con.execute("""
            DELETE FROM history WHERE rowid IN (
                SELECT rowid FROM history WHERE user_id=?
                ORDER BY ts DESC LIMIT -1 OFFSET 200
            )
        """, (user_id,))
    con.close()

def fav_add(user_id: int, code: str, article: str, title: Optional[str]) -> None:
    con = db_connect()
    with con:
        con.execute(
            "INSERT OR REPLACE INTO favorites(user_id, code, article, title, added_ts) VALUES(?,?,?,?,?)",
            (user_id, code, article, title, int(time.time())),
        )
    con.close()

def fav_remove(user_id: int, code: str, article: str) -> None:
    con = db_connect()
    with con:
        con.execute("DELETE FROM favorites WHERE user_id=? AND code=? AND article=?", (user_id, code, article))
    con.close()

def fav_list(user_id: int, limit: int = 30) -> List[Tuple[str, str, Optional[str]]]:
    con = db_connect()
    cur = con.cursor()
    cur.execute(
        "SELECT code, article, title FROM favorites WHERE user_id=? ORDER BY added_ts DESC LIMIT ?",
        (user_id, limit),
    )
    rows = cur.fetchall()
    con.close()
    return [(r[0], r[1], r[2]) for r in rows]

def hist_list(user_id: int, limit: int = 20) -> List[Tuple[int, str, Optional[str], str]]:
    con = db_connect()
    cur = con.cursor()
    cur.execute(
        "SELECT ts, query, code_filter, kind FROM history WHERE user_id=? ORDER BY ts DESC LIMIT ?",
        (user_id, limit),
    )
    rows = cur.fetchall()
    con.close()
    return rows

# =========================
# SESSION STATE
# =========================
@dataclass
class SessionState:
    owner_id: int
    created_ts: float
    code_filter: str = "ALL"
    short_mode: bool = True

SESSIONS: Dict[int, SessionState] = {}
LAST_USER_MSG: Dict[Tuple[int, int], float] = {}
_cleanup_started = False

# =========================
# HELPERS
# =========================
def is_admin(member: discord.Member) -> bool:
    if member.guild_permissions.administrator:
        return True
    if member.id in ADMIN_USER_IDS:
        return True
    if ADMIN_ROLE_IDS:
        role_ids = {r.id for r in getattr(member, "roles", [])}
        return any(rid in role_ids for rid in ADMIN_ROLE_IDS)
    return False

def can_create_session(member: discord.Member) -> bool:
    return True  # Все могут создавать сессии

def count_user_sessions(guild: discord.Guild, user_id: int) -> int:
    n = 0
    for ch_id, st in SESSIONS.items():
        if st.owner_id == user_id:
            ch = guild.get_channel(ch_id)
            if isinstance(ch, discord.TextChannel):
                n += 1
    return n

def is_session_channel(ch: discord.abc.GuildChannel) -> bool:
    return isinstance(ch, discord.TextChannel) and ch.name.startswith(SESSION_PREFIX)

def clamp(s: str, n: int) -> str:
    if s is None:
        return ""
    if len(s) <= n:
        return s
    return s[: max(0, n - 1)] + "…"

def split_for_discord(text: str, chunk: int = 1800) -> List[str]:
    if not text:
        return [""]
    parts: List[str] = []
    while text:
        parts.append(text[:chunk])
        text = text[chunk:]
    return parts

def get_code_options() -> List[discord.SelectOption]:
    opts = [discord.SelectOption(label="Все", value="ALL", description="Искать по всей базе")]
    for code, title in list(LAW_COMMANDS.items())[:24]:
        opts.append(discord.SelectOption(label=code.upper(), value=code, description=title[:50]))
    return opts

# =========================
# ARTICLE DETECT
# =========================
ARTICLE_NUM_RE = re.compile(r"(?i)\b(?:ст\.?|статья)?\s*(\d+(?:[.\-]\d+)*)\b")

def detect_article_num(text: str) -> Optional[str]:
    m = ARTICLE_NUM_RE.search(text or "")
    if not m:
        return None
    return m.group(1).strip().replace("-", ".")

def detect_code_from_text(text: str) -> Optional[str]:
    text_lower = (text or "").lower()
    for code in LAW_COMMANDS.keys():
        if code in text_lower or f"!{code}" in text_lower:
            return code
    return None

# =========================
# PAGINATION (article)
# =========================
class ArticlePager(discord.ui.View):
    def __init__(self, user_id: int, title: str, content: str):
        super().__init__(timeout=600)
        self.user_id = user_id
        self.title = title
        self.pages = split_for_discord(content, 1800)
        self.i = 0
        self.code = ""
        self.article = ""
        
        # Извлекаем код и номер статьи из заголовка
        if " - Статья " in title:
            parts = title.replace("📜 ", "").split(" - Статья ")
            if len(parts) == 2:
                self.code = parts[0].split("(")[1].rstrip(")") if "(" in parts[0] else parts[0]
                self.article = parts[1]

    def make_embed(self) -> discord.Embed:
        emb = discord.Embed(title=self.title, color=discord.Color.blue())
        emb.description = self.pages[self.i] if self.pages else ""
        if len(self.pages) > 1:
            emb.set_footer(text=f"Стр. {self.i+1}/{len(self.pages)} | Hardy Help")
        else:
            emb.set_footer(text="Hardy Help | Majestic RP")
        return emb

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        return interaction.user.id == self.user_id

    @discord.ui.button(label="⬅️", style=discord.ButtonStyle.secondary)
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.i > 0:
            self.i -= 1
        await interaction.response.edit_message(embed=self.make_embed(), view=self)

    @discord.ui.button(label="➡️", style=discord.ButtonStyle.secondary)
    async def next_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.i < len(self.pages) - 1:
            self.i += 1
        await interaction.response.edit_message(embed=self.make_embed(), view=self)

    @discord.ui.button(label="📌 В избранное", style=discord.ButtonStyle.primary)
    async def fav_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.code and self.article:
            fav_add(interaction.user.id, self.code, self.article, self.title)
            await interaction.response.send_message(f"Сохранено: **{self.code} ст. {self.article}** ⭐", ephemeral=True)
        else:
            await interaction.response.send_message("Не удалось сохранить", ephemeral=True)

    @discord.ui.button(label="🗑 Удалить", style=discord.ButtonStyle.danger)
    async def unfav_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.code and self.article:
            fav_remove(interaction.user.id, self.code, self.article)
            await interaction.response.send_message(f"Удалено: **{self.code} ст. {self.article}**", ephemeral=True)
        else:
            await interaction.response.send_message("Не удалось удалить", ephemeral=True)

# =========================
# SESSION HEADER VIEW
# =========================
class SessionView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

        sel = discord.ui.Select(
            placeholder="Фильтр кодекса (Все/УК/АК/...)",
            options=get_code_options(),
            min_values=1,
            max_values=1,
            custom_id="sess:code_filter",
        )
        sel.callback = self._on_select_code
        self.add_item(sel)

    def _get_state(self, channel_id: int) -> Optional[SessionState]:
        return SESSIONS.get(channel_id)

    async def _ensure_session(self, interaction: discord.Interaction) -> Optional[SessionState]:
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("Только на сервере.", ephemeral=True)
            return None
        if not isinstance(interaction.channel, discord.TextChannel):
            await interaction.response.send_message("Только в текстовом канале.", ephemeral=True)
            return None

        st = self._get_state(interaction.channel_id)
        if not st:
            owner_id = interaction.user.id
            if interaction.channel.topic:
                m = re.search(r"owner=(\d+)", interaction.channel.topic)
                if m:
                    owner_id = int(m.group(1))
            st = SessionState(owner_id=owner_id, created_ts=time.time(), code_filter="ALL", short_mode=True)
            SESSIONS[interaction.channel_id] = st
        return st

    def _is_owner_or_admin(self, member: discord.Member, st: SessionState) -> bool:
        return member.id == st.owner_id or is_admin(member)

    async def _on_select_code(self, interaction: discord.Interaction):
        st = await self._ensure_session(interaction)
        if not st:
            return
        member = interaction.user
        if not self._is_owner_or_admin(member, st):
            return await interaction.response.send_message("Только владелец может менять фильтр.", ephemeral=True)

        value = interaction.data.get("values", ["ALL"])[0]
        st.code_filter = value
        await interaction.response.send_message(f"✅ Фильтр: **{st.code_filter.upper()}**", ephemeral=True)

    @discord.ui.button(label="Коротко / Подробно", style=discord.ButtonStyle.secondary, custom_id="sess:toggle_mode")
    async def toggle_mode(self, interaction: discord.Interaction, button: discord.ui.Button):
        st = await self._ensure_session(interaction)
        if not st:
            return
        member = interaction.user
        if not self._is_owner_or_admin(member, st):
            return await interaction.response.send_message("Только владелец может менять режим.", ephemeral=True)

        st.short_mode = not st.short_mode
        await interaction.response.send_message(
            f"✅ Режим: **{'коротко' if st.short_mode else 'подробно'}**",
            ephemeral=True,
        )

    @discord.ui.button(label="Избранное", style=discord.ButtonStyle.secondary, emoji="⭐", custom_id="sess:fav")
    async def fav_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        rows = fav_list(interaction.user.id, 30)
        if not rows:
            return await interaction.response.send_message("⭐ Избранное пустое.", ephemeral=True)

        lines = []
        for code, article, title in rows:
            t = f" — {title}" if title else ""
            lines.append(f"• **{code} ст. {article}**{t[:50]}")
        await interaction.response.send_message(clamp("\n".join(lines), 1900), ephemeral=True)

    @discord.ui.button(label="История", style=discord.ButtonStyle.secondary, emoji="🕘", custom_id="sess:history")
    async def history_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        rows = hist_list(interaction.user.id, 20)
        if not rows:
            return await interaction.response.send_message("🕘 История пустая.", ephemeral=True)

        lines = []
        for ts, q, cf, kind in rows:
            when = time.strftime("%H:%M", time.localtime(ts))
            cf_txt = cf or "ALL"
            lines.append(f"`{when}` **{kind}** [{cf_txt}] {clamp(q, 80)}")

        await interaction.response.send_message(clamp("\n".join(lines), 1900), ephemeral=True)

    @discord.ui.button(label="Закрыть сессию", style=discord.ButtonStyle.secondary, emoji="❌", custom_id="sess:close")
    async def close_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        st = await self._ensure_session(interaction)
        if not st:
            return
        member = interaction.user
        if not self._is_owner_or_admin(member, st):
            return await interaction.response.send_message("Только владелец/админ может закрыть сессию.", ephemeral=True)

        await interaction.response.send_message("Удаляю канал…", ephemeral=True)
        ch = interaction.channel
        if isinstance(ch, discord.TextChannel):
            try:
                await ch.delete(reason="Hardy Laws: session closed")
            except Exception as e:
                await interaction.followup.send(f"Не смог удалить канал: `{e}`", ephemeral=True)
        SESSIONS.pop(interaction.channel_id, None)

# =========================
# MAIN MENU VIEW
# =========================
class MainMenuView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    async def _ensure_guild(self, interaction: discord.Interaction) -> bool:
        if not interaction.guild or not isinstance(interaction.user, discord.Member):
            await interaction.response.send_message("Команда доступна только на сервере.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Создать сессию", style=discord.ButtonStyle.primary, custom_id="menu:create_session")
    async def create_session_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not await self._ensure_guild(interaction):
            return

        member = interaction.user
        guild = interaction.guild

        if count_user_sessions(guild, member.id) >= MAX_SESSIONS_PER_USER and not is_admin(member):
            return await interaction.response.send_message(
                f"Лимит сессий: {MAX_SESSIONS_PER_USER}. Закрой старую.",
                ephemeral=True,
            )

        ch = await create_session_channel(guild, member, base_channel=interaction.channel)
        await interaction.response.send_message(f"✅ Сессия создана: {ch.mention}", ephemeral=True)

    @discord.ui.button(label="Помощь", style=discord.ButtonStyle.secondary, custom_id="menu:help")
    async def help_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        result = await call_api({})
        if result.get('success'):
            emb = discord.Embed(title=result['title'], description=result['content'], color=discord.Color.blue())
            emb.set_footer(text="Hardy Help | Majestic RP")
            await interaction.response.send_message(embed=emb, ephemeral=True)
        else:
            await interaction.response.send_message("Не удалось загрузить справку", ephemeral=True)

# =========================
# SESSION CREATE / CLEANUP
# =========================
async def create_session_channel(
    guild: discord.Guild,
    owner: discord.Member,
    base_channel: Optional[discord.abc.GuildChannel] = None,
) -> discord.TextChannel:
    category = base_channel.category if isinstance(base_channel, discord.TextChannel) else None

    safe_name = re.sub(r"[^a-z0-9\-]", "", owner.name.lower().replace("_", "-"))
    if not safe_name:
        safe_name = str(owner.id)
    name = (SESSION_PREFIX + safe_name)[:90]

    overwrites = {
        guild.default_role: discord.PermissionOverwrite(view_channel=False),
        owner: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
        guild.me: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
    }
    for role in guild.roles:
        if role.id in ADMIN_ROLE_IDS:
            overwrites[role] = discord.PermissionOverwrite(
                view_channel=True, send_messages=True, read_message_history=True, manage_channels=True
            )

    ch = await guild.create_text_channel(
        name=name,
        overwrites=overwrites,
        category=category,
        topic=f"Hardy Laws session owner={owner.id}",
        reason="Hardy Laws: create private session",
    )

    SESSIONS[ch.id] = SessionState(owner_id=owner.id, created_ts=time.time(), code_filter="ALL", short_mode=True)

    emb = discord.Embed(
        title="📚 Hardy Laws — приватная сессия",
        description=(
            f"Владелец: {owner.mention}\n\n"
            "**Как пользоваться:**\n"
            "• Пиши номер статьи: `ст. 6` или `!ук 6`\n"
            "• Поиск по тексту: `убийство` или `!поиск угон`\n"
            "• Выбери фильтр кодекса сверху\n\n"
            f"⏰ Авто-удаление через **{SESSION_TTL_HOURS} ч.**"
        ),
        color=discord.Color.blue()
    )
    emb.set_footer(text="Hardy Help | Majestic RP")
    view = SessionView()
    msg = await ch.send(embed=emb, view=view)
    try:
        await msg.pin()
    except Exception:
        pass

    return ch

async def cleanup_loop():
    await bot.wait_until_ready()
    ttl = SESSION_TTL_HOURS * 3600
    while not bot.is_closed():
        now = time.time()
        for ch_id, st in list(SESSIONS.items()):
            if now - st.created_ts >= ttl:
                ch = bot.get_channel(ch_id)
                if isinstance(ch, discord.TextChannel):
                    try:
                        await ch.delete(reason="Hardy Laws: session TTL expired")
                    except Exception:
                        pass
                SESSIONS.pop(ch_id, None)
        await asyncio.sleep(60)

# =========================
# RESPONSE HELPERS
# =========================
def create_embed(title: str, content: str, success: bool = True) -> discord.Embed:
    color = discord.Color.blue() if success else discord.Color.red()
    emb = discord.Embed(title=title, description=content[:4000], color=color)
    emb.set_footer(text="Hardy Help | Majestic RP")
    return emb

async def send_article_response(ctx_or_msg, user_id: int, result: dict):
    """Отправить ответ с пагинацией для статьи"""
    if result.get('success'):
        title = result.get('title', 'Результат')
        content = result.get('content', '')
        
        if len(content) > 1800:
            pager = ArticlePager(user_id=user_id, title=title, content=content)
            emb = pager.make_embed()
            if isinstance(ctx_or_msg, discord.Message):
                await ctx_or_msg.reply(embed=emb, view=pager)
            else:
                await ctx_or_msg.send(embed=emb, view=pager)
        else:
            emb = create_embed(title, content)
            if isinstance(ctx_or_msg, discord.Message):
                await ctx_or_msg.reply(embed=emb)
            else:
                await ctx_or_msg.send(embed=emb)
    else:
        emb = create_embed("❌ Ошибка", result.get('error', 'Неизвестная ошибка'), success=False)
        if isinstance(ctx_or_msg, discord.Message):
            await ctx_or_msg.reply(embed=emb)
        else:
            await ctx_or_msg.send(embed=emb)

# =========================
# SLASH COMMANDS
# =========================
@bot.tree.command(name="menu", description="Главное меню Hardy Laws")
async def slash_menu(inter: discord.Interaction):
    emb = discord.Embed(
        title="📚 Hardy Laws",
        description="Нажми кнопку ниже, чтобы создать приватную сессию для работы с законами.",
        color=discord.Color.blue()
    )
    emb.set_footer(text="Hardy Help | Majestic RP")
    await inter.response.send_message(embed=emb, view=MainMenuView())

@bot.tree.command(name="session", description="Создать приватную сессию")
async def slash_session(inter: discord.Interaction):
    if not inter.guild or not isinstance(inter.user, discord.Member):
        return await inter.response.send_message("Команда доступна только на сервере.", ephemeral=True)

    if count_user_sessions(inter.guild, inter.user.id) >= MAX_SESSIONS_PER_USER and not is_admin(inter.user):
        return await inter.response.send_message(f"Лимит сессий: {MAX_SESSIONS_PER_USER}.", ephemeral=True)

    ch = await create_session_channel(inter.guild, inter.user, base_channel=inter.channel)
    return await inter.response.send_message(f"✅ Сессия создана: {ch.mention}", ephemeral=True)

@bot.tree.command(name="law", description="Получить статью закона")
@app_commands.describe(code="Код закона (ук, ак, дк...)", article="Номер статьи")
async def slash_law(inter: discord.Interaction, code: str, article: str):
    code = code.lower().strip()
    article = article.strip()
    
    if code not in LAW_COMMANDS:
        codes_list = ", ".join(LAW_COMMANDS.keys())
        return await inter.response.send_message(f"Неизвестный код. Доступные: {codes_list}", ephemeral=True)
    
    result = await call_api({'command': code, 'article': article})
    hist_add(inter.user.id, f"{code} {article}", code, "law")
    
    await inter.response.defer()
    if result.get('success'):
        title = result.get('title', 'Результат')
        content = result.get('content', '')
        
        if len(content) > 1800:
            pager = ArticlePager(user_id=inter.user.id, title=title, content=content)
            emb = pager.make_embed()
            await inter.followup.send(embed=emb, view=pager)
        else:
            emb = create_embed(title, content)
            await inter.followup.send(embed=emb)
    else:
        emb = create_embed("❌ Ошибка", result.get('error', 'Неизвестная ошибка'), success=False)
        await inter.followup.send(embed=emb)

@bot.tree.command(name="search", description="Поиск по всем законам")
@app_commands.describe(query="Текст для поиска")
async def slash_search(inter: discord.Interaction, query: str):
    result = await call_api({'query': query})
    hist_add(inter.user.id, query, None, "search")
    
    await inter.response.defer()
    if result.get('success'):
        emb = create_embed(result.get('title', 'Поиск'), result.get('content', ''))
        await inter.followup.send(embed=emb)
    else:
        emb = create_embed("❌ Ошибка", result.get('error', 'Неизвестная ошибка'), success=False)
        await inter.followup.send(embed=emb)

# =========================
# PREFIX COMMANDS
# =========================
@bot.command(name="menu")
async def menu_cmd(ctx: commands.Context):
    emb = discord.Embed(
        title="📚 Hardy Laws",
        description="Нажми кнопку ниже, чтобы создать приватную сессию для работы с законами.",
        color=discord.Color.blue()
    )
    emb.set_footer(text="Hardy Help | Majestic RP")
    await ctx.send(embed=emb, view=MainMenuView())

@bot.command(name="помощь")
async def help_laws(ctx: commands.Context):
    result = await call_api({})
    if result.get('success'):
        emb = create_embed(result['title'], result['content'])
        await ctx.send(embed=emb)

@bot.command(name="поиск")
async def search_cmd(ctx: commands.Context, *, query: str = None):
    if not query:
        await ctx.send("❌ Укажите текст для поиска: `!поиск [текст]`")
        return
    
    result = await call_api({'query': query})
    hist_add(ctx.author.id, query, None, "search")
    await send_article_response(ctx, ctx.author.id, result)

# Динамические команды для каждого закона
for cmd_name in LAW_COMMANDS.keys():
    async def law_command(ctx: commands.Context, article: str = None, _cmd=cmd_name):
        if article:
            result = await call_api({'command': _cmd, 'article': article})
            hist_add(ctx.author.id, f"{_cmd} {article}", _cmd, "law")
        else:
            result = await call_api({'command': _cmd})
            hist_add(ctx.author.id, _cmd, _cmd, "law")
        await send_article_response(ctx, ctx.author.id, result)
    
    bot.command(name=cmd_name)(law_command)

# =========================
# SESSION MESSAGE HANDLER
# =========================
@bot.event
async def on_message(message: discord.Message):
    await bot.process_commands(message)

    if message.author.bot:
        return
    if not isinstance(message.channel, discord.TextChannel):
        return
    if not is_session_channel(message.channel):
        return

    # Игнорируем команды
    if message.content.startswith('!'):
        return

    st = SESSIONS.get(message.channel.id)
    if not st:
        owner_id = message.author.id
        if message.channel.topic:
            m = re.search(r"owner=(\d+)", message.channel.topic)
            if m:
                owner_id = int(m.group(1))
        st = SessionState(owner_id=owner_id, created_ts=time.time(), code_filter="ALL", short_mode=True)
        SESSIONS[message.channel.id] = st

    key = (message.channel.id, message.author.id)
    now = time.time()
    if now - LAST_USER_MSG.get(key, 0.0) < COOLDOWN_SECONDS:
        return
    LAST_USER_MSG[key] = now

    query = (message.content or "").strip()
    if not query:
        return

    code_filter = None if st.code_filter == "ALL" else st.code_filter

    try:
        # Попытка найти номер статьи
        num = detect_article_num(query)
        detected_code = detect_code_from_text(query) or code_filter
        
        if num:
            if detected_code:
                result = await call_api({'command': detected_code, 'article': num})
            else:
                # Поиск по номеру во всех законах
                result = await call_api({'query': f"статья {num}"})
            hist_add(message.author.id, query, code_filter, "law")
        else:
            # Поиск по тексту
            result = await call_api({'query': query})
            hist_add(message.author.id, query, code_filter, "search")

        await send_article_response(message, message.author.id, result)

    except Exception as e:
        log.exception("Error while answering")
        await message.reply(f"Ошибка при обработке запроса: `{e}`")

# =========================
# READY / SYNC
# =========================
@bot.event
async def on_ready():
    global _cleanup_started
    db_init()

    # persistent views
    bot.add_view(MainMenuView())
    bot.add_view(SessionView())

    log.info("Logged in as %s", bot.user)
    log.info("API URL: %s", API_URL)
    log.info("SQLite: %s", str(SQLITE_PATH.resolve()))

    if not _cleanup_started:
        _cleanup_started = True
        bot.loop.create_task(cleanup_loop())

    try:
        await bot.tree.sync()
        log.info("Slash commands synced globally")
    except Exception:
        log.exception("Slash sync failed")

def main():
    if not DISCORD_TOKEN:
        raise RuntimeError("DISCORD_TOKEN не задан!")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_URL или SUPABASE_ANON_KEY не заданы!")
    bot.run(DISCORD_TOKEN)

if __name__ == "__main__":
    main()
```

## Запуск

```bash
python bot.py
```

## Возможности

| Команда | Описание |
|---------|----------|
| `/menu` | Главное меню с кнопками |
| `/session` | Создать приватную сессию |
| `/law ук 6` | Статья 6 УК с пагинацией |
| `/search убийство` | Поиск по всем законам |
| `!menu` | Главное меню (префикс) |
| `!ук 6` | Статья 6 УК |
| `!поиск угон` | Поиск по тексту |

## Сессии

- Приватный канал для каждого пользователя
- Фильтр по кодексу
- Переключатель коротко/подробно
- Избранное и история
- Авто-удаление через 6 часов

## Требования Discord

1. **Message Content Intent** — обязательно!
2. **Server Members Intent** — для сессий
3. Права: Manage Channels, Send Messages, Embed Links, Read Message History
