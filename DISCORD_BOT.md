# Discord Bot для законов Majestic RP

## Установка

```bash
pip install discord.py aiohttp python-dotenv
```

## Настройка

Создай файл `.env`:

```env
DISCORD_BOT_TOKEN=MTQ2NzE5NzI0NjM2NDg0NDE2NA.xxx.xxx
SUPABASE_URL=https://irdylmsqtnsgdlmoqqof.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHlsbXNxdG5zZ2RsbW9xcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTAxOTMsImV4cCI6MjA4MTY2NjE5M30.4k3pysKDUfqrjlqOPlmXTw9DEbC2IRHKwRC0XCJ9PNY
```

## Код бота

```python
import discord
from discord.ext import commands
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

# Настройки
DISCORD_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
API_URL = f"{SUPABASE_URL}/functions/v1/discord-bot"

# Интенты
intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

# Список команд законов
LAW_COMMANDS = [
    'ук', 'ак', 'дк', 'пк', 'гк', 'тк', 'эк', 'конст',
    'зооо', 'кзсс', 'зпоо', 'знгс', 'заа', 'зсми', 
    'зфрб', 'знг', 'зсс', 'зems', 'зорд', 'зордер'
]

async def call_api(data: dict) -> dict:
    """Вызов API для получения информации о законах"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(API_URL, json=data, headers=headers) as response:
            return await response.json()

def create_embed(title: str, content: str, success: bool = True) -> discord.Embed:
    """Создание красивого embed сообщения"""
    color = discord.Color.blue() if success else discord.Color.red()
    embed = discord.Embed(title=title, description=content, color=color)
    embed.set_footer(text="Hardy Help | Majestic RP")
    return embed

@bot.event
async def on_ready():
    print(f'✅ Бот {bot.user} запущен!')
    print(f'📚 Доступно команд: {len(LAW_COMMANDS)}')

@bot.command(name='помощь')
async def help_laws(ctx):
    """Показать список доступных команд"""
    result = await call_api({})
    if result.get('success'):
        embed = create_embed(result['title'], result['content'])
        await ctx.send(embed=embed)

@bot.command(name='поиск')
async def search(ctx, *, query: str = None):
    """Поиск по всем законам"""
    if not query:
        await ctx.send("❌ Укажите текст для поиска: `!поиск [текст]`")
        return
    
    result = await call_api({'query': query})
    embed = create_embed(
        result.get('title', 'Результат'),
        result.get('content') or result.get('error', 'Ошибка'),
        result.get('success', False)
    )
    await ctx.send(embed=embed)

# Динамически создаём команды для каждого закона
for cmd_name in LAW_COMMANDS:
    async def law_command(ctx, article: str = None, _cmd=cmd_name):
        """Получить информацию о законе или конкретной статье"""
        data = {'command': _cmd}
        if article:
            data['article'] = article
        
        result = await call_api(data)
        embed = create_embed(
            result.get('title', 'Результат'),
            result.get('content') or result.get('error', 'Ошибка'),
            result.get('success', False)
        )
        await ctx.send(embed=embed)
    
    # Регистрируем команду
    bot.command(name=cmd_name)(law_command)

# Запуск бота
if __name__ == '__main__':
    bot.run(DISCORD_TOKEN)
```

## Примеры использования

| Команда | Описание |
|---------|----------|
| `!помощь` | Список всех команд |
| `!ук` | Показать Уголовный кодекс |
| `!ук 6` | Статья 6 УК |
| `!ак 3` | Статья 3 АК |
| `!дк 2` | Статья 2 ДК |
| `!поиск угон` | Поиск по всем законам |

## Требования Discord Developer Portal

1. Включи **Message Content Intent** в настройках бота
2. Добавь бота на сервер с правами:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Read Message History

## Запуск

```bash
python bot.py
```
