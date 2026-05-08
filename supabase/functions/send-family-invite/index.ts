import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API");

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, token, inviterName } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Missing email or token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API secret" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const deepLink = `family-cookbook://join?token=${encodeURIComponent(token)}`;
    const inviteLink = `https://blzwcujchavhzlvvdxwh.supabase.co/functions/v1/join-redirect?token=${encodeURIComponent(token)}`;
    const senderName = inviterName || "A family member";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Grandma's Cookbook <onboarding@resend.dev>",
        to: ["dangelo.watson1212@gmail.com"],
        subject: `${senderName} invited you to join their family cookbook`,
        html: `
          <div style="font-family: Georgia, serif; background:#FDFAF4; padding:40px 24px; max-width:480px; margin:0 auto;">
            <h1 style="font-size:28px; color:#3F3426; margin-bottom:8px;">Grandma's Cookbook</h1>
            <p style="color:#5C4F3A; font-size:16px; margin-bottom:32px;">
              ${senderName} has invited you to join their family cookbook — a place to save, share, and cook family recipes together.
            </p>
            <a href="${inviteLink}" style="display:inline-block;background:#556B2F;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:999px;font-size:16px;font-weight:bold;">
              Join the Family Cookbook
            </a>
            <p style="color:#7A6E5A; font-size:12px; margin-top:32px;">
              This invite expires in 7 days. If you did not expect this email, you can ignore it.
            </p>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: resendData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: resendData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
