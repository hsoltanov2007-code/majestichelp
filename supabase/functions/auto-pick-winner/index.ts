import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

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

      // Get winner's email from auth
      const { data: winnerAuth } = await supabase.auth.admin.getUserById(winner.user_id);
      const winnerEmail = winnerAuth?.user?.email;

      // Send winner email notification
      if (winnerEmail && resendKey) {
        try {
          const winnerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(220, 38, 38, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(220, 38, 38, 0.15);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%); padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(220, 38, 38, 0.3);">
                <span style="font-size: 42px; font-weight: 800; background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -1px;">🛡️ HARDY</span>
              </div>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0; letter-spacing: 2px; text-transform: uppercase;">Правовой портал Majestic RP</p>
            </td>
          </tr>
          
          <!-- Trophy -->
          <tr>
            <td style="padding: 10px 40px; text-align: center;">
              <div style="font-size: 72px; line-height: 1;">🏆</div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 10px 40px 20px;">
              <h1 style="color: #f1f5f9; font-size: 28px; font-weight: 800; margin: 0 0 12px; text-align: center;">Поздравляем! Вы выиграли!</h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">Вы стали победителем розыгрыша на HARDY!</p>
            </td>
          </tr>

          <!-- Prize Box -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%); border: 1px solid rgba(220, 38, 38, 0.4); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Розыгрыш</p>
                <p style="color: #f1f5f9; font-size: 18px; font-weight: 700; margin: 0 0 16px;">${giveaway.title}</p>
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Ваш приз</p>
                <p style="color: #f87171; font-size: 22px; font-weight: 800; margin: 0;">${giveaway.prize}</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">Для получения приза войдите на сайт и напишите в тикет поддержки, который был создан для вас автоматически.</p>
              <a href="https://majestichelp.lovable.app/#/profile" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px -10px rgba(220, 38, 38, 0.5);">Получить приз 🎁</a>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 10px 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(220, 38, 38, 0.3) 50%, transparent 100%);"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 10px 40px 40px; text-align: center;">
              <p style="color: #475569; font-size: 12px; margin: 0;">© 2025 HARDY — Ваш надёжный правовой помощник</p>
              <p style="margin: 8px 0 0;">
                <a href="https://majestichelp.lovable.app" style="color: #f87171; text-decoration: none; font-size: 13px;">majestichelp.lovable.app</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await resend.emails.send({
            from: "HARDY <onboarding@resend.dev>",
            to: [winnerEmail],
            subject: `🏆 Вы выиграли в розыгрыше «${giveaway.title}»!`,
            html: winnerEmailHtml,
          });

          console.log(`Winner email sent to ${winnerEmail} for giveaway ${giveaway.id}`);
        } catch (emailErr) {
          console.error("Failed to send winner email:", emailErr);
        }
      }

      results.push({ giveaway_id: giveaway.id, winner: winner.user_id, email_sent: !!winnerEmail });
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
