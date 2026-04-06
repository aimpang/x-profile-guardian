import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-poll-secret",
};

interface ProfileSnapshot {
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  banner?: string;
}

async function refreshXToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchXProfile(accessToken: string) {
  const res = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,name,username,profile_banner_url",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ?? null;
}

async function sendEmailAlert(resendKey: string, email: string, field: string, oldVal: any, newVal: any) {
  const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "XSentinel Alerts <alerts@xsentinel.dev>",
      to: [email],
      subject: `🚨 XSentinel Alert: Your ${fieldName} was changed`,
      html: `
        <div style="font-family: system-ui, -apple-system, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000; margin-bottom: 8px;">🚨 Profile Change Detected</h2>
          <p style="color: #333; font-size: 16px;">Your X account profile was updated.</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; font-weight: 600; color: #444; width: 120px;">Field</td>
                <td style="padding: 12px 0; color: #000;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: 600; color: #444;">Before</td>
                <td style="padding: 12px 0; color: #555;">${oldVal ?? "<em>Not set</em>"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: 600; color: #444;">After</td>
                <td style="padding: 12px 0; color: #000; font-weight: 500;">${newVal ?? "<em>Not set</em>"}</td>
              </tr>
            </table>
          </div>
          <p style="margin: 20px 0;">
            <a href="https://xsentinel.dev" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    }),
  });
}

async function sendPushAlert(appId: string, restKey: string, pushToken: string, field: string, oldVal: any, newVal: any) {
  const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${restKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_player_ids: [pushToken],
      headings: { en: "🚨 XSentinel Alert" },
      contents: { en: `Your ${fieldName} was changed` },
      data: { field, oldVal, newVal },
      priority: 10,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: either poll secret header or service role bearer
  const pollSecret = Deno.env.get("POLL_SECRET");
  const incomingSecret = req.headers.get("x-poll-secret");
  const authHeader = req.headers.get("authorization") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const validPollSecret = pollSecret && incomingSecret === pollSecret;
  const validServiceRole = authHeader === `Bearer ${serviceRoleKey}`;

  if (!validPollSecret && !validServiceRole) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );

  const clientId = Deno.env.get("X_CLIENT_ID")!;
  const clientSecret = Deno.env.get("X_CLIENT_SECRET")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
  const oneSignalKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

  // Fetch all active/trial accounts with tokens
  const { data: accounts, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .neq("subscription_status", "expired")
    .not("x_access_token", "is", null);

  if (error) {
    console.error("Failed to fetch accounts:", error);
    return new Response("DB error", { status: 500, headers: corsHeaders });
  }

  const results: string[] = [];

  for (const account of accounts ?? []) {
    try {
      let accessToken = account.x_access_token;

      // Try to refresh token if we have a refresh token
      if (account.x_refresh_token && clientId && clientSecret) {
        const refreshed = await refreshXToken(clientId, clientSecret, account.x_refresh_token);
        if (refreshed?.access_token) {
          accessToken = refreshed.access_token;
          // Save new tokens
          await supabase
            .from("connected_accounts")
            .update({
              x_access_token: refreshed.access_token,
              x_refresh_token: refreshed.refresh_token ?? account.x_refresh_token,
            })
            .eq("id", account.id);
        }
      }

      const profile = await fetchXProfile(accessToken);
      if (!profile) {
        results.push(`${account.x_username}: failed to fetch profile`);
        continue;
      }

      const current: ProfileSnapshot = {
        username: profile.username,
        display_name: profile.name,
        bio: profile.description ?? "",
        profile_image: profile.profile_image_url?.replace("_normal", "") ?? null,
        banner: profile.profile_banner_url ?? null,
      };

      const snapshot: ProfileSnapshot = (account.last_snapshot as ProfileSnapshot) ?? {};
      const fields: (keyof ProfileSnapshot)[] = ["username", "display_name", "bio", "profile_image", "banner"];

      const changed: string[] = [];

      for (const field of fields) {
        const oldVal = snapshot[field] ?? null;
        const newVal = current[field] ?? null;
        if (oldVal === newVal) continue;

        // Insert alert
        await supabase.from("alerts").insert([{
          user_id: account.user_id,
          event_type: field,
          old_data: { [field]: oldVal },
          new_data: { [field]: newVal },
        }]);

        // Fetch user email
        const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
        const email = userData?.user?.email;

        if (email && resendKey) {
          await sendEmailAlert(resendKey, email, field, oldVal, newVal);
        }

        if (account.push_enabled && account.push_token && oneSignalAppId && oneSignalKey) {
          await sendPushAlert(oneSignalAppId, oneSignalKey, account.push_token, field, oldVal, newVal);
        }

        changed.push(field);
      }

      // Update snapshot
      if (changed.length > 0) {
        await supabase
          .from("connected_accounts")
          .update({ last_snapshot: current })
          .eq("id", account.id);
        results.push(`${account.x_username}: changed [${changed.join(", ")}]`);
      } else {
        results.push(`${account.x_username}: no changes`);
      }
    } catch (e) {
      console.error(`Error processing ${account.x_username}:`, e);
      results.push(`${account.x_username}: error - ${e}`);
    }
  }

  console.log("Poll results:", results);
  return new Response(JSON.stringify({ polled: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
