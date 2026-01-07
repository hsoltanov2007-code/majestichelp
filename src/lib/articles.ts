import { ARTICLES_URL } from "../config";

export type ArticleData = {
  criminalArticles?: any[];
  adminArticles?: any[];
  trafficArticles?: any[];
  procedures?: Record<string, any>;
  governmentRules?: any[];
  proceduralCode?: any[];
  legalTheory?: Record<string, any>;
};

const CACHE_KEY = "articles_cache_v1";
const CACHE_TIME_KEY = "articles_cache_time_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 часов

export async function loadArticles(): Promise<ArticleData> {
  // 1) если есть свежий кэш — отдаем сразу (быстро)
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = Number(localStorage.getItem(CACHE_TIME_KEY) || "0");
  const isFresh = cached && Date.now() - cachedTime < CACHE_TTL_MS;

  if (isFresh) {
    try {
      return JSON.parse(cached!);
    } catch {}
  }

  // 2) пробуем скачать с GitHub Pages
  try {
    // cache-busting, чтобы не прилипало к кэшу браузера
    const url = `${ARTICLES_URL}?t=${Date.now()}`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    return data;
  } catch (e) {
    // 3) если не удалось скачать — отдаём старый кэш, если есть
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    // 4) иначе кидаем ошибку (и показываем в UI "нет данных/интернета")
    throw e;
  }
}

export function clearArticlesCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
}
