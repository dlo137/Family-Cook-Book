Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { phone, token, inviterName } = await req.json();

    if (!phone || !token) {
      return new Response(JSON.stringify({ error: "Missing phone or token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing TWILIO_AUTH_TOKEN secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ACCOUNT_SID = "AC3c6d98ab9d114532aeec4f27fa7a0b27";
    const MESSAGING_SERVICE_SID = "MGaae859fa95828b8d14b358d2d3bca659";

    const redirectUrl = `https://blzwcujchavhzlvvdxwh.supabase.co/functions/v1/join-redirect?token=${encodeURIComponent(token)}`;
    const sender = inviterName || "Someone";
    const body = `${sender} invited you to join their family cookbook on Grandma's Cookbook. Tap to join: ${redirectUrl}`;

    const credentials = btoa(`${ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const params = new URLSearchParams({ To: phone, MessagingServiceSid: MESSAGING_SERVICE_SID, Body: body });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      return new Response(JSON.stringify({ error: twilioData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
