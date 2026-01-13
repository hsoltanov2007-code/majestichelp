import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received auth email hook request");
    
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log(`Processing ${email_action_type} email for ${user.email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    let subject = "";
    let html = "";

    if (email_action_type === "signup" || email_action_type === "email") {
      subject = "🛡️ HARDY — Подтверждение регистрации";
      html = `
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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99, 102, 241, 0.15);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.3);">
                <span style="font-size: 42px; font-weight: 800; background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -1px;">🛡️ HARDY</span>
              </div>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0; letter-spacing: 2px; text-transform: uppercase;">Правовой портал Majestic RP</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h1 style="color: #f1f5f9; font-size: 26px; font-weight: 700; margin: 0 0 16px; text-align: center;">Добро пожаловать!</h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">Спасибо за регистрацию на HARDY. Подтвердите ваш email, чтобы получить полный доступ ко всем материалам портала.</p>
            </td>
          </tr>
          
          <!-- Token Box -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Ваш код подтверждения</p>
                <code style="display: block; font-size: 38px; font-weight: 700; color: #a78bfa; letter-spacing: 8px; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${token}</code>
              </div>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">или нажмите кнопку ниже</p>
              <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.5); transition: all 0.3s;">Подтвердить Email ✓</a>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%);"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Если вы не регистрировались на HARDY, просто проигнорируйте это письмо.</p>
              <p style="color: #475569; font-size: 12px; margin: 0;">© 2025 HARDY — Ваш надёжный правовой помощник</p>
              <p style="margin: 16px 0 0;">
                <a href="https://majestic-help.com" style="color: #818cf8; text-decoration: none; font-size: 13px;">majestic-help.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    } else if (email_action_type === "recovery" || email_action_type === "magiclink") {
      subject = "🛡️ HARDY — Восстановление пароля";
      html = `
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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(99, 102, 241, 0.3); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99, 102, 241, 0.15);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.3);">
                <span style="font-size: 42px; font-weight: 800; background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -1px;">🛡️ HARDY</span>
              </div>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0; letter-spacing: 2px; text-transform: uppercase;">Правовой портал Majestic RP</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h1 style="color: #f1f5f9; font-size: 26px; font-weight: 700; margin: 0 0 16px; text-align: center;">Восстановление пароля</h1>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 0 0 24px; text-align: center;">Вы запросили сброс пароля. Используйте код ниже или нажмите кнопку для продолжения.</p>
            </td>
          </tr>
          
          <!-- Token Box -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Ваш код восстановления</p>
                <code style="display: block; font-size: 38px; font-weight: 700; color: #a78bfa; letter-spacing: 8px; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${token}</code>
              </div>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">или нажмите кнопку ниже</p>
              <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.5);">Сбросить пароль 🔑</a>
            </td>
          </tr>
          
          <!-- Warning -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="color: #fbbf24; font-size: 13px; margin: 0;">⚠️ Код действителен 10 минут</p>
              </div>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%);"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
              <p style="color: #475569; font-size: 12px; margin: 0;">© 2025 HARDY — Ваш надёжный правовой помощник</p>
              <p style="margin: 16px 0 0;">
                <a href="https://majestic-help.com" style="color: #818cf8; text-decoration: none; font-size: 13px;">majestic-help.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    } else {
      // Default email for other types
      subject = "🛡️ HARDY — Уведомление";
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 40px; background: #1a1a2e; font-family: Arial, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; background: #2a2a3e; border-radius: 16px; padding: 40px; border: 1px solid #3a3a4e;">
    <h1 style="color: #ffffff; text-align: center; margin: 0 0 20px;">🛡️ HARDY</h1>
    <p style="color: #d0d0d0; text-align: center;">Ваш код: <strong style="color: #a78bfa;">${token}</strong></p>
    <p style="color: #888888; text-align: center; font-size: 12px; margin-top: 30px;">© HARDY — Правовой портал Majestic RP</p>
  </div>
</body>
</html>
      `;
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    const { error } = await resend.emails.send({
      from: "HARDY <onboarding@resend.dev>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully");

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
