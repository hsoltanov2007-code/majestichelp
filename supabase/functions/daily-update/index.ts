import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Daily update orchestrator for Denver legal codes.
 * Steps:
 *   init   → create log, chain to scrape&index=0
 *   scrape → scrape ONE source, chain next or reparse
 *   reparse → parse all sources, finalize log
 * 
 * Accepts optional { sourceId } to update a single source.
 */

function chainNext(supabaseUrl: string, supabaseKey: string, body: any) {
  fetch(`${supabaseUrl}/functions/v1/daily-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(body),
  }).catch(e => console.error("Chain call failed:", e));
}

async function appendLog(
  supabase: any, logId: string | undefined,
  updates: { changes?: string[]; errors?: string[]; sourcesUpdated?: number }
) {
  if (!logId) return;
  const { data: current } = await supabase.from("update_logs").select("changes, errors, sources_updated").eq("id", logId).single();
  if (!current) return;
  const merged: any = {};
  if (updates.changes?.length) merged.changes = [...(current.changes as string[] || []), ...updates.changes];
  if (updates.errors?.length) merged.errors = [...(current.errors as string[] || []), ...updates.errors];
  if (updates.sourcesUpdated) merged.sources_updated = (current.sources_updated || 0) + updates.sourcesUpdated;
  if (Object.keys(merged).length) await supabase.from("update_logs").update(merged).eq("id", logId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body for cron */ }

  const step = body.step || "init";
  const logId = body.logId;
  const singleSourceId = body.sourceId || null;

  async function isCancelled(): Promise<boolean> {
    if (!logId) return false;
    const { data } = await supabase.from("update_logs").select("status").eq("id", logId).single();
    return data?.status === "cancelled";
  }

  try {
    // ─── STEP: INIT ───
    if (step === "init") {
      // Lock: skip if another run is in progress
      const LOCK_TTL_MS = 1000 * 60 * 30;
      const { data: runningLogs } = await supabase
        .from("update_logs")
        .select("id, started_at, created_at")
        .eq("status", "running")
        .order("created_at", { ascending: true })
        .limit(1);

      if (runningLogs && runningLogs.length > 0) {
        const running = runningLogs[0] as any;
        const startedAt = new Date(running.started_at || running.created_at).getTime();
        const ageMs = Date.now() - startedAt;

        if (Number.isFinite(ageMs) && ageMs > LOCK_TTL_MS) {
          console.log("Stale lock detected — closing running log", running.id);
          await supabase.from("update_logs").update({
            status: "error",
            finished_at: new Date().toISOString(),
            errors: [`Auto-closed stale run (${Math.round(ageMs / 60000)} min)`] as any,
          }).eq("id", running.id);
        } else {
          console.log("Skipping: another run is already in progress");
          return new Response(JSON.stringify({ success: false, reason: "already_running" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data: logEntry } = await supabase
        .from("update_logs")
        .insert({ status: "running" })
        .select("id")
        .single();
      const newLogId = logEntry?.id;

      if (singleSourceId) {
        // Update single source: scrape it directly
        chainNext(supabaseUrl, supabaseKey, { step: "scrape", logId: newLogId, sourceIndex: 0, singleSourceId });
      } else {
        chainNext(supabaseUrl, supabaseKey, { step: "scrape", logId: newLogId, sourceIndex: 0 });
      }

      return new Response(JSON.stringify({ success: true, step: "init", logId: newLogId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── STEP: SCRAPE ───
    if (step === "scrape") {
      if (await isCancelled()) {
        return new Response(JSON.stringify({ success: false, reason: "cancelled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let sources: any[] = [];
      if (singleSourceId || body.singleSourceId) {
        const sid = singleSourceId || body.singleSourceId;
        const { data } = await supabase.from("code_sources").select("*").eq("id", sid).eq("is_active", true);
        sources = data || [];
      } else {
        const { data } = await supabase.from("code_sources").select("*").eq("is_active", true).order("order_index");
        sources = data || [];
      }

      const sourceIndex = body.sourceIndex || 0;

      if (sourceIndex >= sources.length) {
        // All sources scraped → reparse
        chainNext(supabaseUrl, supabaseKey, { step: "reparse", logId, reparseIndex: 0, singleSourceId: body.singleSourceId });
        return new Response(JSON.stringify({ success: true, step: "scrape", done: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const source = sources[sourceIndex];
      const changes: string[] = [];
      const errors: string[] = [];

      try {
        console.log(`Scraping source ${sourceIndex + 1}/${sources.length}: ${source.short_name}`);
        
        const scrapeRes = await fetch(`${supabaseUrl}/functions/v1/scrape-topic`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ sourceId: source.id }),
        });
        const scrapeData = await scrapeRes.json();

        if (scrapeData.success) {
          changes.push(`[СКРЕЙП] ${source.short_name}: ${scrapeData.messagesCount} сообщ., ${scrapeData.pagesScraped} стр., ${scrapeData.textLength} симв.`);
        } else {
          errors.push(`${source.short_name}: ${scrapeData.error}`);
        }

        await appendLog(supabase, logId, { changes, errors, sourcesUpdated: 1 });
      } catch (e) {
        errors.push(`${source.short_name}: ${(e as Error).message}`);
        await appendLog(supabase, logId, { errors });
      }

      // Chain to next source
      chainNext(supabaseUrl, supabaseKey, { step: "scrape", logId, sourceIndex: sourceIndex + 1, singleSourceId: body.singleSourceId });

      return new Response(JSON.stringify({ success: true, step: "scrape", index: sourceIndex }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── STEP: REPARSE ───
    if (step === "reparse") {
      if (await isCancelled()) {
        return new Response(JSON.stringify({ success: false, reason: "cancelled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let sources: any[] = [];
      if (body.singleSourceId) {
        const { data } = await supabase.from("code_sources").select("*").eq("id", body.singleSourceId).eq("is_active", true);
        sources = data || [];
      } else {
        const { data } = await supabase.from("code_sources").select("*").eq("is_active", true).order("order_index");
        sources = data || [];
      }

      const reparseIndex = body.reparseIndex || 0;

      if (reparseIndex >= sources.length) {
        // All done — finalize
        const totalChanges = [];
        if (logId) {
          const { data: logData } = await supabase.from("update_logs").select("changes").eq("id", logId).single();
          const allChanges = (logData?.changes || []) as string[];
          const hasChanges = allChanges.some(c => c.startsWith("[+СТ]") || c.startsWith("[~СТ]") || c.startsWith("[⊘СТ]"));
          
          await supabase.from("update_logs").update({
            status: hasChanges ? "completed_with_changes" : "completed_no_changes",
            finished_at: new Date().toISOString(),
          }).eq("id", logId);
        }

        return new Response(JSON.stringify({ success: true, step: "reparse", done: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const source = sources[reparseIndex];
      const changes: string[] = [];
      const errors: string[] = [];

      try {
        console.log(`Reparsing ${source.short_name}...`);
        
        const parseRes = await fetch(`${supabaseUrl}/functions/v1/parse-legal-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ sourceId: source.id }),
        });
        const parseData = await parseRes.json();

        if (parseData.success) {
          changes.push(`[ПАРСИНГ] ${source.short_name}: ${parseData.articlesCount} статей (${parseData.newCount || 0} новых, ${parseData.updatedCount || 0} обновл.)`);
          if (parseData.changeDetails) {
            changes.push(...parseData.changeDetails);
          }
          // Update articles_reparsed count
          if (logId) {
            const { data: current } = await supabase.from("update_logs").select("articles_reparsed").eq("id", logId).single();
            await supabase.from("update_logs").update({
              articles_reparsed: (current?.articles_reparsed || 0) + (parseData.articlesCount || 0),
            }).eq("id", logId);
          }
        } else {
          errors.push(`Парсинг ${source.short_name}: ${parseData.error}`);
        }

        await appendLog(supabase, logId, { changes, errors });
      } catch (e) {
        errors.push(`Парсинг ${source.short_name}: ${(e as Error).message}`);
        await appendLog(supabase, logId, { errors });
      }

      // Chain to next reparse
      chainNext(supabaseUrl, supabaseKey, { step: "reparse", logId, reparseIndex: reparseIndex + 1, singleSourceId: body.singleSourceId });

      return new Response(JSON.stringify({ success: true, step: "reparse", index: reparseIndex }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown step: " + step }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    if (logId) {
      await supabase.from("update_logs").update({
        status: "error",
        finished_at: new Date().toISOString(),
        errors: [(e as Error).message] as any,
      }).eq("id", logId);
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});