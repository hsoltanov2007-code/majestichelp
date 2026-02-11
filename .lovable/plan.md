

# Подключение ChatGPT к юридическому боту HARDY

## Что будет сделано

Переключение AI-бота с Lovable AI Gateway на прямой вызов OpenAI API с твоим ключом.

## Шаги

1. **Сохранение API ключа** -- безопасно сохраним твой OpenAI API ключ как секрет проекта (он не будет виден в коде)

2. **Обновление edge-функции `legal-chat`** -- заменим вызов Lovable AI Gateway на прямой вызов OpenAI API:
   - URL: `https://api.openai.com/v1/chat/completions`
   - Модель: `gpt-4o` (или другая по желанию)
   - Авторизация через твой ключ вместо LOVABLE_API_KEY

3. **Всё остальное остаётся без изменений** -- база знаний, промпт, фронтенд чат-бота -- всё работает как раньше

## Техническая деталь

В файле `supabase/functions/legal-chat/index.ts` (строки 401-431) заменяется:
- `LOVABLE_API_KEY` на `OPENAI_API_KEY`
- URL с `https://ai.gateway.lovable.dev/v1/chat/completions` на `https://api.openai.com/v1/chat/completions`
- Модель с `google/gemini-2.5-flash` на `gpt-4o`

## Что нужно от тебя

- OpenAI API ключ (начинается с `sk-...`). Его можно взять на https://platform.openai.com/api-keys

