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
      subject = 'Подтверждение регистрации';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Добро пожаловать!</h1>
          <p style="color: #666; font-size: 16px;">Спасибо за регистрацию на нашем портале.</p>
          <p style="color: #666; font-size: 16px;">Ваш код подтверждения:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <code style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px;">${token}</code>
          </div>
          <p style="color: #999; font-size: 14px;">Если вы не регистрировались, просто проигнорируйте это письмо.</p>
        </div>
      `;
    } else if (type === 'magiclink') {
      subject = 'Вход в аккаунт';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Вход в аккаунт</h1>
          <p style="color: #666; font-size: 16px;">Ваш код для входа:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <code style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 4px;">${token}</code>
          </div>
          <p style="color: #999; font-size: 14px;">Код действителен 10 минут.</p>
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
