import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find expired active giveaways
    const { data: expiredGiveaways, error: fetchError } = await supabase
      .from("giveaways")
      .select("*")
      .eq("status", "active")
      .not("ends_at", "is", null)
      .lte("ends_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    const results = [];

    for (const giveaway of expiredGiveaways || []) {
      // Get approved entries
      const { data: approvedEntries } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", giveaway.id)
        .eq("status", "approved");

      if (!approvedEntries || approvedEntries.length === 0) {
        // No approved entries, just complete it
        await supabase
          .from("giveaways")
          .update({ status: "completed" })
          .eq("id", giveaway.id);
        results.push({ giveaway_id: giveaway.id, winner: null });
        continue;
      }

      // Pick random winner
      const winner =
        approvedEntries[Math.floor(Math.random() * approvedEntries.length)];

      // Update giveaway
      const { error: updateError } = await supabase
        .from("giveaways")
        .update({ status: "completed", winner_id: winner.user_id })
        .eq("id", giveaway.id);

      if (updateError) throw updateError;

      // Create support ticket for winner
      const { data: ticket } = await supabase
        .from("support_tickets")
        .insert({
          user_id: winner.user_id,
          subject: `🎉 Вы выиграли в розыгрыше: ${giveaway.title}`,
          status: "open",
        })
        .select()
        .single();

      if (ticket) {
        await supabase.from("support_messages").insert({
          ticket_id: ticket.id,
          sender_id: winner.user_id,
          is_admin: true,
          content: `Поздравляем! Вы стали победителем розыгрыша "${giveaway.title}"!\n\nВаш приз: ${giveaway.prize}\n\nНапишите в этот тикет для получения приза.`,
        });
      }

      results.push({ giveaway_id: giveaway.id, winner: winner.user_id });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
