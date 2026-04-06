import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twitter-webhooks-signature",
};

interface ProfileSnapshot {
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  banner?: string;
}

// ←←← PUT YOUR X APP CONSUMER SECRET HERE (keep it secret!)
const X_CONSUMER_SECRET = Deno.env.get("X_CONSUMER_SECRET")!;

async function verifyXSignature(req: Request, body: string): Promise<boolean> {
  const signatureHeader = req.headers.get("x-twitter-webhooks-signature");
  if (!signatureHeader || !X_CONSUMER_SECRET) return false;

  const signature = signatureHeader.replace("sha256=", "");
  const key = new TextEncoder().encode(X_CONSUMER_SECRET);
  const data = new TextEncoder().encode(body);

  const hmac = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    data,
  );

  const expected = Array.from(new Uint8Array(hmac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

async function sendPushNotification(token: string, title: string, body: string) {
  console.log(`[PUSH] ${title} → ${body} (token: ${token})`);
  // TODO: Add real OneSignal / FCM call here later
}

async function sendEmailAlert(email: string, eventType: string, oldVal: any, newVal: any) {
  console.log(
    `[EMAIL] ${email} | ${eventType} changed | old: ${JSON.stringify(oldVal)} | new: ${JSON.stringify(newVal)}`,
  );
  // TODO: Add real email service (Resend, Postmark, etc.) here later
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const bodyText = await req.text();
  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  // Verify XAA signature (required for security)
  if (!(await verifyXSignature(req, bodyText))) {
    console.error("Invalid XAA webhook signature");
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const event = payload.data;
    if (!event?.event_type?.startsWith("profile.update.")) {
      return new Response("Not a profile update event", { status: 200, headers: corsHeaders });
    }

    const x_user_id = event.filter?.user_id;
    const changePayload = event.payload; // { before, after }

    if (!x_user_id || !changePayload?.after) {
      return new Response("Missing user_id or payload", { status: 400, headers: corsHeaders });
    }

    // Find connected account
    const { data: account, error: accError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("x_user_id", x_user_id)
      .maybeSingle();

    if (accError || !account) {
      return new Response("Account not found", { status: 404, headers: corsHeaders });
    }

    // Skip if subscription expired
    if (account.subscription_status === "expired") {
      return new Response("Subscription expired", { status: 200, headers: corsHeaders });
    }

    const snapshot: ProfileSnapshot = (account.last_snapshot as ProfileSnapshot) || {};

    // Extract the changed field (e.g. "profile.update.bio" → "bio")
    const field = event.event_type.replace("profile.update.", "") as keyof ProfileSnapshot;

    // Create alert
    const alertData = {
      user_id: account.user_id,
      event_type: field,
      old_data: { [field]: snapshot[field] || null },
      new_data: { [field]: changePayload.after },
    };

    await supabase.from("alerts").insert([alertData]);

    // Update last_snapshot
    const newSnapshot = { ...snapshot, [field]: changePayload.after };
    await supabase.from("connected_accounts").update({ last_snapshot: newSnapshot }).eq("id", account.id);

    // Send notifications
    const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
    const email = userData?.user?.email;

    if (email) {
      await sendEmailAlert(email, field, alertData.old_data, alertData.new_data);
    }

    if (account.push_enabled && account.push_token) {
      await sendPushNotification(account.push_token, "🚨 XGuard Alert", `Your ${field.replace("_", " ")} was changed`);
    }

    return new Response(JSON.stringify({ message: "Alert processed successfully", field }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("XAA Webhook error:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
