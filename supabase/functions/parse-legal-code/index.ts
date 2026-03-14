import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ArticlePart {
  number: string;
  text: string;
  punishment: string;
}

interface ParsedArticle {
  article_number: string;
  article_title: string;
  jurisdiction: string;
  description: string;
  section_name: string;
  chapter_name: string;
  parts: ArticlePart[];
  is_void: boolean;
  sort_order: number;
}

function parseLegalCode(text: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  const normalizeLine = (raw: string) =>
    raw
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .replace(/^\s*[•\-\u2022*]+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

  const isJunkLine = (line: string) =>
    /^(Majestic|Главная|Форум|Что нового|Вход|Регистрация|Закрыто|Registered|Реакции:|Поделиться:|Facebook|LinkedIn|Reddit|Pinterest|WhatsApp|Community platform|Верх|Низ|Показать|Забыли|Оставаться|Войти|Passkey|RSS|Условия|Политика|Помощь|Русский)/i.test(line) ||
    /^#\d+$/.test(line) ||
    /^https?:\/\//i.test(line) ||
    /^Автор темы/i.test(line) ||
    /^Дьявол штата/i.test(line) ||
    /^Последнее редактирование/i.test(line) ||
    /^Like/i.test(line) ||
    /^Yare Fiend$/i.test(line) ||
    /^Ezio Immortal$/i.test(line) ||
    /^\d{2}\.\d{2}\.\d{4}$/.test(line);

  const partStartRe = /^(?:ч\.?|част[ьи])\s*([0-9]+(?:\.[0-9]+)*)(?:\.)?\s*(.*)$/i;
  const pointStartRe = /^(?:п\.?|пункт)\s*([0-9]+(?:\.[0-9]+)*)(?:\.)?\s*(.*)$/i;
  const listStartRe = /^([0-9]{1,3})(?:[.)])\s*(.*)$/; // 1) text OR 1. text

  const lines = text
    .split("\n")
    .map(normalizeLine)
    .filter((l) => !!l && !isJunkLine(l));
  
  let currentSection = '';
  let currentChapter = '';
  let sortOrder = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (/^(Majestic|Главная|Форум|Что нового|Вход|Регистрация|Закрыто|Registered|Реакции:|Поделиться:|Facebook|LinkedIn|Reddit|Pinterest|WhatsApp|Community platform|Верх|Низ|Показать|Забыли|Оставаться|Войти|Passkey|RSS|Условия|Политика|Помощь|Русский)/i.test(line)) continue;
    if (/^#\d+$/.test(line)) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (/^Автор темы/i.test(line)) continue;
    if (/^Дьявол штата/i.test(line)) continue;
    if (/^Последнее редактирование/i.test(line)) continue;
    if (/^Like/i.test(line)) continue;
    if (/^Yare Fiend$/i.test(line)) continue;
    if (/^Ezio Immortal$/i.test(line)) continue;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(line)) continue;
    
    const sectionMatch = line.match(/^(?:РАЗДЕЛ|Раздел)\s+([IVXLCDM\d]+\.?\s*.+)/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].replace(/\s+/g, ' ').trim();
      continue;
    }
    
    const subsectionMatch = line.match(/^(?:ПОДРАЗДЕЛ|Подраздел)\s+([IVXLCDM\d]+\.?\s*.+)/i);
    if (subsectionMatch) {
      currentChapter = subsectionMatch[1].replace(/\s+/g, ' ').trim();
      continue;
    }
    
    const chapterMatch = line.match(/^(?:ГЛАВА|Глава)\s+([IVXLCDM\d]+\.?\s*.+)/i);
    if (chapterMatch) {
      currentChapter = chapterMatch[1].replace(/\s+/g, ' ').trim();
      continue;
    }

    const articleMatch = line.match(/^Статья\s+([0-9]+(?:[.\-][0-9]+)*)(?:\.)?\s*(.*)$/i);
    if (articleMatch) {
      sortOrder++;
      const articleNumber = articleMatch[1].replace(/\.+$/, "");
      let rest = (articleMatch[2] || "").trim();
      
      if (/утратила?\s+силу/i.test(rest) || /утратила?\s+силу/i.test(lines[i + 1] || '')) {
        articles.push({
          article_number: articleNumber,
          article_title: 'Утратила силу',
          jurisdiction: '',
          description: '',
          section_name: currentSection,
          chapter_name: currentChapter,
          parts: [],
          is_void: true,
          sort_order: sortOrder,
        });
        continue;
      }

      let jurisdiction = '';
      const jurMatch = rest.match(/\[([^\]]+)\]/);
      if (jurMatch) {
        jurisdiction = jurMatch[1];
        rest = rest.replace(/\[[^\]]+\]\s*/, '').trim();
      }
      const jurParenMatch = rest.match(/\((?:(?:[А-ЯЁа-яё]+)(?:\s*\/\s*[А-ЯЁа-яё]+)*)\)/);
      const isJurisdiction = jurParenMatch && /ФЕДЕРАЛЬН|РЕГИОНАЛЬН|ВЕДОМСТВЕНН|ФИНАНСОВ/i.test(jurParenMatch[0]);
      if (!jurisdiction && isJurisdiction && jurParenMatch) {
        const raw = jurParenMatch[0].replace(/[()]/g, '').trim();
        const parts = raw.split('/').map(s => s.trim().toLowerCase());
        const mapped = parts.map(p => {
          if (p.startsWith('федеральн')) return 'Федеральная';
          if (p.startsWith('региональн')) return 'Региональная';
          if (p.startsWith('ведомственн')) return 'Ведомственная';
          if (p.startsWith('финансов')) return 'Финансовая';
          return p;
        });
        jurisdiction = mapped.join('/');
        rest = rest.replace(jurParenMatch[0], '').trim();
      }
      rest = rest.replace(/[★☆]+\s*/g, '').trim();
      rest = rest.replace(/[,.\s]+$/, '').trim();

      let articleTitle = rest;
      let description = '';
      const parts: ArticlePart[] = [];
      let j = i + 1;
      
      while (j < lines.length) {
        const nextLine = lines[j];
        if (/^Статья\s/i.test(nextLine)) break;
        if (/^(?:РАЗДЕЛ|Раздел)\s/i.test(nextLine)) break;
        if (/^(?:ГЛАВА|Глава)\s/i.test(nextLine)) break;
        if (partStartRe.test(nextLine) || pointStartRe.test(nextLine) || listStartRe.test(nextLine) || subItemRe.test(nextLine) || subItemDotRe.test(nextLine)) break;
        if (/^Наказание:/i.test(nextLine)) break;
        if (/^Примечание:/i.test(nextLine)) break;
        if (/^Особенная часть/i.test(nextLine)) break;
        if (/^Общая часть/i.test(nextLine)) break;
        if (/^Комментарий/i.test(nextLine)) break;
        
        if (!articleTitle) {
          articleTitle = nextLine;
        } else {
          description += (description ? ' ' : '') + nextLine;
        }
        j++;
      }

      let currentPartNumber = '';
      let currentPartText = '';
      let singlePunishment = '';
      
      while (j < lines.length) {
        const nextLine = lines[j];
        if (/^Статья\s/i.test(nextLine)) break;
        if (/^(?:РАЗДЕЛ|Раздел)\s/i.test(nextLine)) break;
        if (/^(?:ГЛАВА|Глава)\s/i.test(nextLine)) break;
        if (/^Особенная часть/i.test(nextLine)) break;
        if (/^Общая часть/i.test(nextLine)) break;
        
        const partMatch = nextLine.match(partStartRe);
        const pointMatch = nextLine.match(pointStartRe);
        const listMatch = nextLine.match(listStartRe);
        const subItemMatch = nextLine.match(subItemDotRe) || nextLine.match(subItemRe);
        const punishmentMatch = nextLine.match(/^Наказание:\s*(.*)/i);
        
        if (partMatch || pointMatch || listMatch || subItemMatch) {
          if (currentPartNumber) {
            parts.push({ number: currentPartNumber, text: currentPartText.trim(), punishment: '' });
          }
          if (partMatch) {
            currentPartNumber = partMatch[1];
            currentPartText = partMatch[2] || '';
          } else if (pointMatch) {
            currentPartNumber = `п.${pointMatch[1]}`;
            currentPartText = pointMatch[2] || '';
          } else if (subItemMatch) {
            currentPartNumber = subItemMatch[1] + ')';
            currentPartText = subItemMatch[2] || '';
          } else {
            currentPartNumber = listMatch![1];
            currentPartText = listMatch![2] || '';
          }
        } else if (punishmentMatch) {
          const punishment = punishmentMatch[1].replace(/[.\s]+$/, '').trim();
          if (currentPartNumber) {
            parts.push({ number: currentPartNumber, text: currentPartText.trim(), punishment });
            currentPartNumber = '';
            currentPartText = '';
          } else {
            singlePunishment = punishment;
          }
        } else if (/^Примечание:/i.test(nextLine) || /^Комментарий/i.test(nextLine)) {
          j++;
          continue;
        } else if (currentPartNumber) {
          currentPartText += ' ' + nextLine;
        } else {
          const isOrgLine = /^(LSPD|LSCSD|FIB|SANG|Government|EMS|WN|GOV|USSS|NSS|DOJ|DA|PD|SD)/i.test(nextLine);
          if (isOrgLine) {
            description += (description ? '\n' : '') + nextLine;
          } else {
            description += (description ? ' ' : '') + nextLine;
          }
        }
        
        j++;
      }
      
      if (currentPartNumber) {
        parts.push({ number: currentPartNumber, text: currentPartText.trim(), punishment: '' });
      }

      if (parts.length === 0 && singlePunishment) {
        parts.push({ number: '1', text: articleTitle, punishment: singlePunishment });
      }
      
      if (singlePunishment && parts.length > 0) {
        for (const part of parts) {
          if (!part.punishment) part.punishment = singlePunishment;
        }
      }

      articles.push({
        article_number: articleNumber,
        article_title: articleTitle,
        jurisdiction,
        description: description
          .replace(/!\[image\]\([^)]*\)/g, '')
          .replace(/Спойлер:\s*[^\n]*/g, '')
          .replace(/\s+/g, ' ')
          .replace(/[,.\s]+$/, '')
          .trim(),
        section_name: currentSection,
        chapter_name: currentChapter,
        parts,
        is_void: false,
        sort_order: sortOrder,
      });
      
      i = j - 1;
    }
  }
  
  // Post-process: extract inline parts
  for (const article of articles) {
    if (article.parts.length === 0 && article.description) {
      const fullText = article.description;
      if (/\*?ч\.?\s*\d/i.test(fullText)) {
        const inlineParts: ArticlePart[] = [];
        const segments = fullText.split(/(?=\*?ч\.?\s*\d)/i);
        for (const seg of segments) {
          const m = seg.match(/\*?ч\.?\s*([\d.]+)\s*([\s\S]*)/i);
          if (m) {
            const num = m[1].replace(/\.$/, '');
            const text = m[2].replace(/\*+/g, '').trim();
            if (text) {
              inlineParts.push({ number: num, text, punishment: '' });
            }
          }
        }
        if (inlineParts.length >= 1) {
          article.parts = inlineParts;
          article.description = '';
        }
      }
    }
  }

  // Post-process: retroactively assign chapter/section names
  for (let i = articles.length - 2; i >= 0; i--) {
    if (!articles[i].chapter_name && articles[i + 1].chapter_name) {
      articles[i].chapter_name = articles[i + 1].chapter_name;
    }
    if (!articles[i].section_name && articles[i + 1].section_name) {
      articles[i].section_name = articles[i + 1].section_name;
    }
  }

  // Post-process: extract image galleries from spoiler sections
  // Look for patterns like "Спойлер: Name" followed by ![image](url) lines
  const imageRe = /!\[image\]\(([^)]+)\)/g;
  const spoilerRe = /Спойлер:\s*(.+)/i;
  const imageGalleries: { name: string; images: string[] }[] = [];
  let currentGalleryName = '';
  let currentGalleryImages: string[] = [];
  
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const spoilerMatch = trimmed.match(spoilerRe);
    if (spoilerMatch) {
      if (currentGalleryName && currentGalleryImages.length > 0) {
        imageGalleries.push({ name: currentGalleryName, images: [...currentGalleryImages] });
      }
      currentGalleryName = spoilerMatch[1].trim();
      currentGalleryImages = [];
      continue;
    }
    const imgMatch = trimmed.match(/!\[image\]\(([^)]+)\)/);
    if (imgMatch && currentGalleryName) {
      currentGalleryImages.push(imgMatch[1]);
    }
  }
  if (currentGalleryName && currentGalleryImages.length > 0) {
    imageGalleries.push({ name: currentGalleryName, images: [...currentGalleryImages] });
  }
  
  // Also check for section headers like "Federal Investigation Bureau" etc. that aren't in spoiler tags
  // but precede image blocks — these are handled by spoiler sections above
  
  // Attach image galleries to the visualization article (typically article 5 for ЗТ)
  if (imageGalleries.length > 0) {
    const vizArticle = articles.find(a => /визуализац/i.test(a.article_title));
    if (vizArticle) {
      vizArticle.parts = imageGalleries.map((g, idx) => ({
        number: String(idx + 1),
        text: g.name,
        punishment: '',
        images: g.images,
      }));
    }
  }

  return articles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId, rawText } = await req.json();
    
    if (!sourceId) {
      throw new Error("sourceId is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let textToParse = rawText;

    if (!textToParse) {
      // Try to get from scraped_content
      const { data: cached } = await supabase
        .from("scraped_content")
        .select("content")
        .eq("source_id", sourceId)
        .single();
      
      if (cached?.content) {
        textToParse = cached.content;
      }
    }

    if (!textToParse) {
      throw new Error("No text to parse");
    }

    console.log("Parsing legal code, text length:", textToParse.length);
    const articles = parseLegalCode(textToParse);
    console.log("Parsed articles:", articles.length);

    for (const a of articles.slice(0, 3)) {
      console.log(`  Article ${a.article_number}: ${a.article_title} (${a.parts.length} parts)`);
    }

    // Preserve stable IDs
    const { data: existingArticles, error: existingErr } = await supabase
      .from("legal_code_articles")
      .select("id, article_number, article_title, is_void, parts, description")
      .eq("source_id", sourceId);

    if (existingErr) {
      console.error("Failed to load existing articles:", existingErr);
      throw existingErr;
    }

    const normalizeArticleNumber = (value: string) =>
      value.replace(/^статья\s+/i, "").replace(/\s+/g, " ").replace(/\.+$/g, "").trim().toLowerCase();
    
    const existingByNumber = new Map(
      (existingArticles || []).map((row) => [normalizeArticleNumber(row.article_number), row]),
    );

    const parsedNumbers = new Set<string>();
    const changeDetails: string[] = [];

    // Deduplicate
    const deduped = new Map<string, typeof articles[0]>();
    for (const a of articles) {
      const norm = normalizeArticleNumber(a.article_number);
      deduped.set(norm, a);
    }
    const uniqueArticles = Array.from(deduped.values());

    let toUpdateTotal = 0, toInsertTotal = 0;
    const batchSize = 50;
    for (let i = 0; i < uniqueArticles.length; i += batchSize) {
      const batch = uniqueArticles.slice(i, i + batchSize).map((a) => {
        const normalizedNumber = normalizeArticleNumber(a.article_number);
        parsedNumbers.add(normalizedNumber);
        const existing = existingByNumber.get(normalizedNumber);

        if (existing) {
          const changes: string[] = [];
          if (existing.article_title !== a.article_title) changes.push(`название: «${existing.article_title}» → «${a.article_title}»`);
          if (existing.is_void !== a.is_void) changes.push(a.is_void ? "утратила силу" : "восстановлена");
          const oldParts = JSON.stringify(existing.parts || []);
          const newParts = JSON.stringify(a.parts || []);
          if (oldParts !== newParts) {
            const oldArr = (existing.parts || []) as any[];
            const newArr = (a.parts || []) as any[];
            const partDiffs: string[] = [];
            for (let pi = 0; pi < Math.max(oldArr.length, newArr.length); pi++) {
              const op = oldArr[pi];
              const np = newArr[pi];
              if (!op && np) {
                const npText = typeof np === 'string' ? np : np?.text || '';
                partDiffs.push(`ч.${pi+1}: добавлена — «${npText.slice(0,80)}${npText.length > 80 ? '...' : ''}»`);
              } else if (op && !np) {
                const opText = typeof op === 'string' ? op : op?.text || '';
                partDiffs.push(`ч.${pi+1}: удалена — «${opText.slice(0,80)}${opText.length > 80 ? '...' : ''}»`);
              } else if (JSON.stringify(op) !== JSON.stringify(np)) {
                const oldText = typeof op === 'string' ? op : op?.text || JSON.stringify(op);
                const newText = typeof np === 'string' ? np : np?.text || JSON.stringify(np);
                partDiffs.push(`ч.${pi+1}: «${oldText.slice(0,80)}» → «${newText.slice(0,80)}»`);
              }
            }
            if (partDiffs.length > 0) {
              changes.push(`части изменены:\n    ${partDiffs.join('\n    ')}`);
            }
          }
          if (existing.description !== a.description && a.description) changes.push("описание изменено");
          if (changes.length > 0) {
            changeDetails.push(`[~СТ] Ст. ${a.article_number}: ${changes.join(", ")}`);
          }
        } else {
          changeDetails.push(`[+СТ] Ст. ${a.article_number} «${a.article_title}» — новая`);
        }

        return {
          id: existing?.id,
          source_id: sourceId,
          section_name: a.section_name,
          chapter_name: a.chapter_name,
          article_number: a.article_number,
          article_title: a.article_title,
          jurisdiction: a.jurisdiction,
          description: a.description,
          parts: a.parts,
          sort_order: a.sort_order,
          is_void: a.is_void,
        };
      });

      const toUpdate = batch.filter((row) => !!row.id);
      const toInsert = batch
        .filter((row) => !row.id)
        .map(({ id, ...rest }) => rest);
      toUpdateTotal += toUpdate.length;
      toInsertTotal += toInsert.length;

      if (toUpdate.length > 0) {
        const { error } = await supabase
          .from("legal_code_articles")
          .upsert(toUpdate as any, { onConflict: "id" });
        if (error) {
          console.error("Upsert error:", error);
          throw error;
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("legal_code_articles").insert(toInsert as any);
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
      }
    }

    // Mark stale rows as void
    const staleIds = (existingArticles || [])
      .filter((row) => !parsedNumbers.has(normalizeArticleNumber(row.article_number)))
      .map((row) => row);

    for (const stale of staleIds) {
      if (!stale.is_void) {
        changeDetails.push(`[⊘СТ] Ст. ${stale.article_number} «${stale.article_title}» — помечена утратившей силу`);
      }
    }

    if (staleIds.length > 0) {
      const { error } = await supabase
        .from("legal_code_articles")
        .update({ is_void: true })
        .in("id", staleIds.map(s => s.id));
      if (error) {
        console.error("Stale void error:", error);
        throw error;
      }
      console.log(`Marked ${staleIds.length} stale articles as void`);
    }

    console.log(`Saved ${uniqueArticles.length} unique articles (${toUpdateTotal} updated, ${toInsertTotal} new, ${changeDetails.length} changes)`);

    return new Response(JSON.stringify({ 
      success: true, 
      articlesCount: uniqueArticles.length,
      sections: [...new Set(uniqueArticles.map(a => a.section_name).filter(Boolean))],
      changeDetails,
      staleCount: staleIds.length,
      newCount: toInsertTotal,
      updatedCount: toUpdateTotal,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});