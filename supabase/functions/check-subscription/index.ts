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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

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
      return new Response(JSON.stringify({ subscribed: false, status: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const sub = subscriptions[0].attributes;
    const subStatus: string = sub.status;

    const isSubscribed = ["on_trial", "active"].includes(subStatus);

    // trial_ends_at and renews_at are already ISO 8601 strings — no Unix conversion needed
    const trialEnd: string | null = sub.trial_ends_at ?? null;
    const currentPeriodEnd: string | null = sub.renews_at ?? null;
    const subscriptionId: string = String(subscriptions[0].id);

    return new Response(JSON.stringify({
      subscribed: isSubscribed,
      status: subStatus,
      trial_end: trialEnd,
      current_period_end: currentPeriodEnd,
      subscription_id: subscriptionId,
    }), {
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
