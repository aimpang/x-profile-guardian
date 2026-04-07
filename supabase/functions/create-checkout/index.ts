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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user?.email) throw new Error("User not authenticated or email not available");
    const user = data.user;

    // Parse plan from request body (defaults to monthly)
    let plan = "monthly";
    try {
      const body = await req.json();
      if (body?.plan === "yearly") plan = "yearly";
    } catch {
      // No body or invalid JSON — use default
    }

    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");

    const storeId = Deno.env.get("LEMONSQUEEZY_STORE_ID");
    if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");

    const variantId = plan === "yearly"
      ? Deno.env.get("LEMONSQUEEZY_VARIANT_YEARLY")
      : Deno.env.get("LEMONSQUEEZY_VARIANT_MONTHLY");
    if (!variantId) throw new Error(`LEMONSQUEEZY_VARIANT_${plan.toUpperCase()} is not set`);

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              user_id: user.id,
            },
          },
          product_options: {
            redirect_url: `${origin}/dashboard?checkout=success`,
          },
          checkout_options: {
            dark: true,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: variantId },
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LemonSqueezy API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const url = result?.data?.attributes?.url;
    if (!url) throw new Error("No checkout URL returned from LemonSqueezy");

    return new Response(JSON.stringify({ url }), {
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
