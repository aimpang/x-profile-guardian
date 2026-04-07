import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { normalizeSnapshot, type ProfileSnapshot } from "../_shared/snapshot.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twitter-webhooks-signature",
};

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
    data
  );

  const expected = Array.from(new Uint8Array(hmac))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

async function sendPushNotification(token: string, field: string, oldValue: any, newValue: any) {
  const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
  const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("[PUSH] OneSignal credentials not set, skipping");
    return;
  }

  const fieldName = field.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [token],
        headings: { en: "🚨 XSentinel Alert" },
        contents: { en: `Your ${fieldName} was changed` },
        data: { field, oldValue, newValue },
        priority: 10,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`[PUSH] Sent for ${fieldName} change`);
    } else {
      console.error("[PUSH] OneSignal error:", result);
    }
  } catch (e) {
    console.error("[PUSH] Failed:", e);
  }
}

async function sendEmailAlert(email: string, eventType: string, oldVal: any, newVal: any) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return;
  }

  const fieldName = eventType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "XSentinel Alerts <alerts@xsentinel.dev>",
        to: [email],
        subject: `🚨 XSentinel Alert: Your ${fieldName} was changed`,
        html: `
          <div style="font-family: system-ui, -apple-system, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #000000; margin-bottom: 8px;">🚨 Profile Change Detected</h2>
            <p style="color: #333; font-size: 16px;">Your X account profile has been updated.</p>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #444; width: 120px;">Field Changed</td>
                  <td style="padding: 12px 0; color: #000;">${fieldName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #444;">Before</td>
                  <td style="padding: 12px 0; color: #555;">${oldVal[eventType] !== undefined && oldVal[eventType] !== null ? oldVal[eventType] : '<em>Not set</em>'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #444;">After</td>
                  <td style="padding: 12px 0; color: #000; font-weight: 500;">${newVal[eventType] !== undefined && newVal[eventType] !== null ? newVal[eventType] : '<em>Not set</em>'}</td>
                </tr>
              </table>
            </div>

            <p style="margin: 20px 0;">
              <a href="https://xsentinel.dev"
                 style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View in XSentinel Dashboard
              </a>
            </p>

            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This alert was sent because a change was detected on your X profile.<br>
              You can mark this as "This was me" in the dashboard.
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Email sent to ${email} for ${eventType}`);
    } else {
      console.error("Resend error:", result);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }
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

    if (!account) {
      return new Response("Account not found", { status: 404, headers: corsHeaders });
    }

    if (account.subscription_status === "expired") {
      return new Response("Subscription expired", { status: 200, headers: corsHeaders });
    }

    const snapshot: ProfileSnapshot = normalizeSnapshot(account.last_snapshot || {});
    let eventField = event.event_type.replace("profile.update.", "");
    const fieldMap: Record<string, keyof ProfileSnapshot> = {
      'name': 'display_name',
      'description': 'bio',
    };
    const canonicalField = (fieldMap[eventField] || eventField) as keyof ProfileSnapshot;

    const alertData = {
      user_id: account.user_id,
      event_type: canonicalField,
      old_data: { [canonicalField]: snapshot[canonicalField] || null },
      new_data: { [canonicalField]: changePayload.after },
    };

    await supabase.from("alerts").insert([alertData]);

    const newSnapshot = normalizeSnapshot({ ...snapshot, [canonicalField]: changePayload.after });
    await supabase
      .from("connected_accounts")
      .update({ last_snapshot: newSnapshot })
      .eq("id", account.id);

    const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
    const email = userData?.user?.email;

    if (email) {
      await sendEmailAlert(email, canonicalField, alertData.old_data, alertData.new_data);
    }

    if (account.push_enabled && account.push_token) {
      await sendPushNotification(
        account.push_token,
        canonicalField,
        alertData.old_data[canonicalField],
        alertData.new_data[canonicalField]
      );
    }

    return new Response("Alert processed", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
