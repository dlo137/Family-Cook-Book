import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify the caller is authenticated (Apple session)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Safety: only allow deleting accounts whose email starts with anon_
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: target, error: lookupError } = await admin.auth.admin.getUserById(userId);
    if (lookupError || !target?.user) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetEmail = target.user.email ?? "";
    if (!targetEmail.startsWith("anon_")) {
      return new Response(JSON.stringify({ error: "Target is not an anonymous account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("family_memberships").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[delete-anonymous-user] error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
