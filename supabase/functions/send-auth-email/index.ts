import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  type: 'signup' | 'magiclink';
  token?: string;
  redirect_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, token, redirect_to }: EmailRequest = await req.json();

    let subject = '';
    let html = '';

    if (type === 'signup') {
      subject = 'HARDY — Подтверждение регистрации';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #1a1a2e; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">🛡️ HARDY</h1>
            <p style="color: #a0a0a0; margin-top: 8px;">Правовой портал</p>
          </div>
          <h2 style="color: #ffffff; text-align: center; font-size: 22px;">Добро пожаловать в HARDY!</h2>
          <p style="color: #d0d0d0; font-size: 16px; text-align: center;">Спасибо за регистрацию на нашем правовом портале.</p>
          <p style="color: #d0d0d0; font-size: 16px; text-align: center;">Ваш код подтверждения:</p>
          <div style="background: #2a2a3e; padding: 25px; text-align: center; border-radius: 10px; margin: 25px 0; border: 1px solid #3a3a4e;">
            <code style="font-size: 36px; font-weight: bold; color: #00d9ff; letter-spacing: 6px;">${token}</code>
          </div>
          <p style="color: #888888; font-size: 13px; text-align: center;">Если вы не регистрировались на HARDY, просто проигнорируйте это письмо.</p>
          <div style="border-top: 1px solid #3a3a4e; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #666666; font-size: 12px;">© HARDY — Ваш надёжный правовой помощник</p>
          </div>
        </div>
      `;
    } else if (type === 'magiclink') {
      subject = 'HARDY — Вход в аккаунт';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #1a1a2e; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">🛡️ HARDY</h1>
            <p style="color: #a0a0a0; margin-top: 8px;">Правовой портал</p>
          </div>
          <h2 style="color: #ffffff; text-align: center; font-size: 22px;">Вход в аккаунт</h2>
          <p style="color: #d0d0d0; font-size: 16px; text-align: center;">Ваш код для входа:</p>
          <div style="background: #2a2a3e; padding: 25px; text-align: center; border-radius: 10px; margin: 25px 0; border: 1px solid #3a3a4e;">
            <code style="font-size: 36px; font-weight: bold; color: #00d9ff; letter-spacing: 6px;">${token}</code>
          </div>
          <p style="color: #888888; font-size: 13px; text-align: center;">Код действителен 10 минут.</p>
          <div style="border-top: 1px solid #3a3a4e; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #666666; font-size: 12px;">© HARDY — Ваш надёжный правовой помощник</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Правовой Портал <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
