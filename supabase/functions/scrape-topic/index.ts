import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";
import { fetchHtml } from "../_shared/vddos.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FORUM_ORIGIN = "https://forum.majestic-rp.ru";

function resolveImgSrc(raw: string): string {
  let src = raw;
  if (src.startsWith("/")) src = FORUM_ORIGIN + src;
  try {
    const u = new URL(src);
    const proxied = u.searchParams.get("image");
    if (proxied) src = proxied;
  } catch { /* keep */ }
  return src;
}

function getTextContent(el: any): string {
  if (!el) return "";
  let result = "";
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      const text = node.textContent || "";
      if (text.trim().startsWith("{") && text.includes("lightbox_close")) continue;
      if (text.trim().startsWith("var ")) continue;
      result += text;
    } else if (node.nodeType === 1) {
      const tag = (node.tagName || "").toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") continue;
      if (tag === "br") result += "\n";
      else if (tag === "p" || tag === "div") result += "\n" + getTextContent(node) + "\n";
      else if (tag === "li") result += "\n• " + getTextContent(node);
      else if (tag === "img") {
        const rawSrc = node.getAttribute("src") || "";
        if (rawSrc && !rawSrc.includes("/avatars/")) {
          result += `\n![image](${resolveImgSrc(rawSrc)})\n`;
        }
      } else if (tag === "b" || tag === "strong") result += `**${getTextContent(node)}**`;
      else if (tag === "i" || tag === "em") result += `*${getTextContent(node)}*`;
      else if (tag === "blockquote") {
        const inner = getTextContent(node).trim().split("\n").map((l: string) => `> ${l}`).join("\n");
        result += "\n" + inner + "\n";
      } else result += getTextContent(node);
    }
  }
  return result;
}

interface ParsedMessage { author: string; date: string; content: string; }

function parseTopicMessagesHtml(html: string): ParsedMessage[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return [];
  const messages: ParsedMessage[] = [];
  const messageEls = doc.querySelectorAll(".message--post, .message, article[data-content]");
  for (const msgEl of messageEls) {
    const authorEl = msgEl.querySelector(".message-name a, .username, [data-user-id] .username") as any;
    const author = authorEl ? (authorEl.textContent || "").trim() : "";
    if (!author) continue;
    const timeEl = msgEl.querySelector("time") as any;
    const date = timeEl ? (timeEl.getAttribute("datetime") || timeEl.textContent || "").trim() : "";
    const contentEl = msgEl.querySelector(".message-body .bbWrapper, .message-content .bbWrapper, .bbWrapper, .message-body, .message-content") as any;
    if (!contentEl) continue;
    const content = getTextContent(contentEl).replace(/\n{3,}/g, "\n\n").trim();
    if (content.length > 5) messages.push({ author, date, content });
  }
  return messages;
}

function findMaxPage(html: string): number {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return 1;
  let maxPage = 1;
  const pageLinks = doc.querySelectorAll(".pageNav-page a, a[href*='page-']");
  for (const link of pageLinks) {
    const href = (link as any).getAttribute("href") || "";
    const m = href.match(/page-(\d+)/);
    if (m) { const num = parseInt(m[1], 10); if (num > maxPage) maxPage = num; }
  }
  const lastPageEl = doc.querySelector(".pageNav-page--last a, .pageNav-jump--last") as any;
  if (lastPageEl) {
    const href = lastPageEl.getAttribute("href") || "";
    const m = href.match(/page-(\d+)/);
    if (m) { const num = parseInt(m[1], 10); if (num > maxPage) maxPage = num; }
  }
  return maxPage;
}

/**
 * Scrapes a forum topic by sourceId, collects all messages from all pages,
 * and saves the combined text to scraped_content table.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceId } = await req.json();
    if (!sourceId) {
      return new Response(
        JSON.stringify({ success: false, error: "sourceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: source, error: sourceError } = await supabase
      .from("code_sources").select("*").eq("id", sourceId).single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ success: false, error: "Source not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping topic:", source.name, source.source_url);
    const firstPageHtml = await fetchHtml(source.source_url);
    const maxPage = findMaxPage(firstPageHtml);
    console.log(`Max page: ${maxPage}`);

    const allMessages: ParsedMessage[] = [];
    allMessages.push(...parseTopicMessagesHtml(firstPageHtml));
    console.log(`Page 1: ${allMessages.length} messages`);

    for (let page = 2; page <= maxPage; page++) {
      try {
        const url = `${source.source_url.replace(/\/$/, '')}/page-${page}`;
        const html = await fetchHtml(url);
        const msgs = parseTopicMessagesHtml(html);
        console.log(`Page ${page}: ${msgs.length} messages`);
        allMessages.push(...msgs);
      } catch (err) {
        console.error(`Error page ${page}:`, err);
      }
    }

    // Combine all message content into one text
    const combinedText = allMessages.map(m => m.content).join('\n\n');

    // Save to scraped_content
    await supabase.from("scraped_content").upsert({
      source_id: sourceId,
      content: combinedText,
      scraped_at: new Date().toISOString(),
    }, { onConflict: "source_id" });

    console.log(`Scraped ${allMessages.length} messages from ${maxPage} pages, total ${combinedText.length} chars`);

    return new Response(
      JSON.stringify({ success: true, messagesCount: allMessages.length, pagesScraped: maxPage, textLength: combinedText.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});