import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate Telegram initData signature
function validateTelegramData(initData: string, botToken: string): Record<string, string> | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");

    // Sort params and build check string
    const checkArr: string[] = [];
    params.forEach((val, key) => {
      checkArr.push(`${key}=${val}`);
    });
    checkArr.sort();
    const checkString = checkArr.join("\n");

    // HMAC-SHA256: key = HMAC-SHA256("WebAppData", botToken), data = checkString
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");

    if (computedHash !== hash) return null;

    // Convert params to object
    const result: Record<string, string> = {};
    params.forEach((val, key) => {
      result[key] = val;
    });
    result.hash = hash;
    return result;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({ error: "initData required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Telegram signature
    const validatedData = validateTelegramData(initData, BOT_TOKEN);
    if (!validatedData) {
      return new Response(JSON.stringify({ error: "Invalid Telegram data" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse user from initData
    const userJson = validatedData.user;
    if (!userJson) {
      return new Response(JSON.stringify({ error: "No user data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = tgUser.id;
    const firstName = tgUser.first_name || "";
    const lastName = tgUser.last_name || "";
    const username = tgUser.username || `tg_${telegramId}`;
    const displayName = username || `${firstName} ${lastName}`.trim() || `user_${telegramId}`;

    // Use Telegram ID as a pseudo-email for Supabase auth
    const pseudoEmail = `tg${telegramId}@telegram.hardy.local`;
    const pseudoPassword = `tg_${telegramId}_${BOT_TOKEN.slice(0, 8)}`;

    // Check if user profile already exists via telegram_chat_id
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("telegram_chat_id", telegramId)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      // User already linked — sign in with their pseudo-email
      userId = existingProfile.id;

      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: pseudoEmail,
        password: pseudoPassword,
      });

      if (signInError || !signInData.session) {
        // Might be old account without pseudo-email auth — create auth entry
        const { data: adminUser, error: createError } = await supabase.auth.admin.createUser({
          email: pseudoEmail,
          password: pseudoPassword,
          email_confirm: true,
          user_metadata: { telegram_id: telegramId, username: displayName },
        });

        if (createError && !createError.message.includes("already registered")) {
          throw createError;
        }

        // Sign in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: pseudoEmail,
          password: pseudoPassword,
        });

        if (retryError || !retryData.session) {
          throw retryError || new Error("Failed to sign in");
        }

        // Link telegram_chat_id to existing profile
        await supabase
          .from("profiles")
          .update({ telegram_chat_id: telegramId })
          .eq("id", existingProfile.id);

        return new Response(JSON.stringify({ 
          session: retryData.session,
          user: tgUser,
          isNew: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        session: signInData.session,
        user: tgUser,
        isNew: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // New Telegram user — create auth account
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email: pseudoEmail,
      password: pseudoPassword,
      email_confirm: true,
      user_metadata: { telegram_id: telegramId, username: displayName },
    });

    if (createError) {
      // If already exists, just sign in
      if (!createError.message.includes("already registered")) {
        throw createError;
      }
    }

    userId = newAuthUser?.user?.id || "";

    // If user was just created, update their profile with telegram data
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          username: displayName,
          telegram_chat_id: telegramId,
        })
        .eq("id", userId);
    }

    // Sign in
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password: pseudoPassword,
    });

    if (sessionError || !sessionData.session) {
      throw sessionError || new Error("Failed to create session");
    }

    return new Response(JSON.stringify({ 
      session: sessionData.session,
      user: tgUser,
      isNew: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("telegram-auth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
