import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // The customer portal URL is embedded directly in the subscription object —
    // no separate session creation call is needed (unlike Stripe's billingPortal.sessions.create)
    const lsResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]=${encodeURIComponent(user.email)}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/vnd.api+json",
        },
      }
    );

    if (!lsResponse.ok) {
      const errText = await lsResponse.text();
      throw new Error(`LemonSqueezy API error ${lsResponse.status}: ${errText}`);
    }

    const lsData = await lsResponse.json();
    const subscriptions = lsData?.data ?? [];

    if (subscriptions.length === 0) {
      throw new Error("No active subscription found. Please subscribe first.");
    }

    // The portal URL is a pre-signed 24-hour link — open it immediately, do not cache or store it
    const portalUrl: string | undefined = subscriptions[0]?.attributes?.urls?.customer_portal;
    if (!portalUrl) throw new Error("Customer portal URL not available for this subscription.");

    return new Response(JSON.stringify({ url: portalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
