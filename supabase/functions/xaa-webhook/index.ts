import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twitter-webhooks-signature",
};

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID")!;
const ONESIGNAL_REST_API_KEY = Deno.env.get(
  "os_v2_app_gg2aqucc4redlblzjp6aato4asusa72qbmtuh3vhpgzpghzgfwfkxibn6kmfwk5lhjnbdwiqvujobsnl7yqkmhzzlgd7rdsmnvu7dgi",
)!;
const X_CONSUMER_SECRET = Deno.env.get("ikLWhBxiQNDEPBzSgpcu7QGstYh5LA8dq8UXMSv2cVtPa9r1i4")!;

interface ProfileSnapshot {
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  banner?: string;
}

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
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.log("[OneSignal] Missing keys - push skipped");
    return;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [token],
        headings: { en: title },
        contents: { en: body },
        priority: 10,
      }),
    });

    const result = await response.json();
    console.log("[OneSignal] Push sent:", result);
  } catch (err) {
    console.error("[OneSignal] Failed to send push:", err);
  }
}

async function sendEmailAlert(email: string, eventType: string, oldVal: any, newVal: any) {
  console.log(`[EMAIL] ${email} | ${eventType} changed`);
  // TODO: Add real email service later
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

  if (!(await verifyXSignature(req, bodyText))) {
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
    const changePayload = event.payload;

    if (!x_user_id || !changePayload?.after) {
      return new Response("Missing data", { status: 400, headers: corsHeaders });
    }

    const { data: account } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("x_user_id", x_user_id)
      .maybeSingle();

    if (!account) return new Response("Account not found", { status: 404, headers: corsHeaders });

    if (account.subscription_status === "expired") {
      return new Response("Subscription expired", { status: 200, headers: corsHeaders });
    }

    const snapshot: ProfileSnapshot = (account.last_snapshot as ProfileSnapshot) || {};
    const field = event.event_type.replace("profile.update.", "") as keyof ProfileSnapshot;

    const alertData = {
      user_id: account.user_id,
      event_type: field,
      old_data: { [field]: snapshot[field] || null },
      new_data: { [field]: changePayload.after },
    };

    await supabase.from("alerts").insert([alertData]);

    const newSnapshot = { ...snapshot, [field]: changePayload.after };
    await supabase.from("connected_accounts").update({ last_snapshot: newSnapshot }).eq("id", account.id);

    const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
    const email = userData?.user?.email;

    if (email) await sendEmailAlert(email, field, alertData.old_data, alertData.new_data);

    if (account.push_enabled && account.push_token) {
      await sendPushNotification(account.push_token, "🚨 XGuard Alert", `Your ${field.replace("_", " ")} was changed`);
    }

    return new Response("Alert processed", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
