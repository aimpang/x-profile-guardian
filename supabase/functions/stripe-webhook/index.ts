import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      logStep("Verified webhook signature", { type: event.type });
    } else {
      // In dev/test, parse without verification
      event = JSON.parse(body);
      logStep("Parsed event without signature verification", { type: event.type });
    }

    const subscription = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        if (!email) {
          logStep("No email on customer, skipping", { customerId });
          break;
        }

        // Find user by email
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);
        if (!user) {
          logStep("No matching user found", { email });
          break;
        }

        // Map Stripe status to our status
        let status: string;
        switch (subscription.status) {
          case "trialing":
            status = "trial";
            break;
          case "active":
            status = "active";
            break;
          case "past_due":
          case "unpaid":
            status = "expired";
            break;
          case "canceled":
          case "incomplete_expired":
            status = "expired";
            break;
          default:
            status = subscription.status;
        }

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        // Update using service role (bypasses trigger restriction)
        const { error } = await supabase
          .from("connected_accounts")
          .update({
            subscription_status: status,
            trial_ends_at: trialEnd,
          })
          .eq("user_id", user.id);

        if (error) {
          logStep("Error updating connected_accounts", { error: error.message });
        } else {
          logStep("Updated subscription status", { userId: user.id, status, trialEnd });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        if (!email) break;

        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);
        if (!user) break;

        await supabase
          .from("connected_accounts")
          .update({ subscription_status: "expired" })
          .eq("user_id", user.id);

        logStep("Subscription deleted, set to expired", { userId: user.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
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
