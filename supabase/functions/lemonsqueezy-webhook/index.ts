import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LS-WEBHOOK] ${step}${d}`);
};

// Verify LemonSqueezy webhook signature using HMAC-SHA256
// LemonSqueezy sends the hex digest in the X-Signature header
async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hexDigest = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexDigest === signature;
}

// Map LemonSqueezy subscription status to our internal subscription_status
// IMPORTANT: "cancelled" in LS means grace period — user still has access until ends_at.
// We map it to "active" here; the "expired" event fires when access truly ends.
function mapStatus(lsStatus: string): string {
  switch (lsStatus) {
    case "on_trial":
      return "trial";
    case "active":
      return "active";
    case "cancelled":
      // Grace period: subscription cancelled but ends_at is in the future
      return "active";
    case "past_due":
    case "unpaid":
    case "expired":
    case "paused":
      return "expired";
    default:
      return "expired";
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") ?? "";
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");

    if (webhookSecret) {
      if (!signature) {
        logStep("Missing X-Signature header");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }
      const valid = await verifySignature(rawBody, signature, webhookSecret);
      if (!valid) {
        logStep("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }
      logStep("Verified webhook signature");
    } else {
      // Dev/test: allow unsigned webhooks (log a warning)
      logStep("WARNING: LEMONSQUEEZY_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const event = JSON.parse(rawBody);
    const eventName: string = event?.meta?.event_name ?? "";
    logStep("Processing event", { eventName });

    const handledEvents = [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_expired",
      "subscription_paused",
      "subscription_unpaused",
      "subscription_resumed",
    ];

    if (!handledEvents.includes(eventName)) {
      logStep("Unhandled event type, ignoring", { eventName });
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subAttributes = event?.data?.attributes ?? {};
    const lsStatus: string = subAttributes.status ?? "";

    // Prefer user_id from custom_data (passed at checkout creation) for direct lookup.
    // Fall back to email-based lookup only if custom_data.user_id is missing.
    const customUserId: string | undefined = event?.meta?.custom_data?.user_id;
    const userEmail: string | undefined = subAttributes.user_email;

    let userId: string | undefined;

    if (customUserId) {
      userId = customUserId;
      logStep("Resolved user via custom_data.user_id", { userId });
    } else if (userEmail) {
      // Fallback: scan users by email (slower at scale — prefer custom_data path)
      const { data: users } = await supabase.auth.admin.listUsers();
      const match = users?.users?.find((u) => u.email === userEmail);
      if (!match) {
        logStep("No matching user found by email", { userEmail });
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
      userId = match.id;
      logStep("Resolved user via email lookup", { userId, userEmail });
    } else {
      logStep("No user_id or email in event, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const status = mapStatus(lsStatus);

    // trial_ends_at is already an ISO 8601 string or null — no Unix conversion needed
    const trialEnd: string | null = subAttributes.trial_ends_at ?? null;

    const { error } = await supabase
      .from("connected_accounts")
      .update({
        subscription_status: status,
        trial_ends_at: trialEnd,
      })
      .eq("user_id", userId);

    if (error) {
      logStep("Error updating connected_accounts", { error: error.message });
    } else {
      logStep("Updated subscription status", { userId, status, trialEnd, lsStatus });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
