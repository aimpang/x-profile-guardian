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
  followers?: number;
  verified?: boolean;
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
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,name,username,profile_banner_url,public_metrics,verified",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ?? null;
}

async function sendEmailAlert(resendKey: string, email: string, field: string, oldVal: any, newVal: any) {
  const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const isImage = field === "profile_image" || field === "banner";

  const renderValue = (val: any) => {
    if (val == null) return `<span style="color:#bbb;font-style:italic;">Not set</span>`;
    if (isImage) return `<img src="${val}" alt="${fieldName}" style="max-width:200px;max-height:80px;border-radius:6px;object-fit:cover;display:block;margin-top:4px;" />`;
    return `<span style="word-break:break-word;">${String(val)}</span>`;
  };

  const isUnauthorized = field !== "followers";
  const securityCta = isUnauthorized ? `
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:10px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:1px;">
            <span style="font-size:18px;line-height:1;">⚠️</span>
          </td>
          <td style="vertical-align:top;">
            <p style="font-size:14px;font-weight:700;color:#92400e;margin:0 0 6px;">Was this you?</p>
            <p style="font-size:13px;color:#78350f;margin:0 0 16px;line-height:1.5;">If you didn't make this change, your account may be compromised. Secure it immediately.</p>
            <a href="https://x.com/settings/security" style="display:inline-block;background:#d97706;color:#fff;padding:11px 22px;text-decoration:none;border-radius:7px;font-size:13px;font-weight:600;letter-spacing:0.01em;">
              Secure My Account →
            </a>
          </td>
        </tr>
      </table>
    </div>` : "";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    reply_to: "support@xsentinel.dev",
    body: JSON.stringify({
      from: "XSentinel <alerts@xsentinel.dev>",
      reply_to: "support@xsentinel.dev",
      to: [email],
      subject: `Security Alert: Your X ${fieldName} Was Changed`,
      html: `
        <div style="font-family: system-ui, -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
          <div style="margin-bottom: 32px;">
            <p style="font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin: 0 0 12px;">XSentinel</p>
            <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px; line-height: 1.3;">Profile Change Detected</h1>
            <p style="font-size: 15px; color: #555; margin: 0; line-height: 1.6;">
              A change was detected on your connected X account.
            </p>
          </div>

          <div style="background: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin: 0 0 16px;">Change Summary</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #777; width: 110px; vertical-align: top;">Field</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-weight: 600;">${fieldName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #777; vertical-align: top;">Previous</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">${renderValue(oldVal)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #777; vertical-align: top;">Updated to</td>
                <td style="padding: 10px 0; color: #111; font-weight: 500;">${renderValue(newVal)}</td>
              </tr>
            </table>
          </div>

          ${securityCta}

          <a href="https://xsentinel.dev/dashboard" style="display: inline-block; background: #000; color: #fff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.01em;">
            Review in Dashboard
          </a>

          <p style="font-size: 12px; color: #aaa; margin-top: 36px; line-height: 1.7; border-top: 1px solid #eee; padding-top: 24px;">
            You received this alert because your X account is monitored by XSentinel.<br>
            <a href="https://xsentinel.dev/dashboard" style="color: #888;">Manage preferences</a> · Reply to this email for support.
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
      headings: { en: "Profile Change Detected" },
      contents: { en: `Your X ${fieldName} was changed. Tap to review.` },
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

      const currentFollowers: number | null = profile.public_metrics?.followers_count ?? null;

      const current: ProfileSnapshot = {
        username: profile.username,
        display_name: profile.name,
        bio: profile.description ?? "",
        profile_image: profile.profile_image_url?.replace("_normal", "") ?? null,
        banner: profile.profile_banner_url ?? null,
        followers: currentFollowers ?? undefined,
        verified: profile.verified ?? false,
      };

      const snapshot: ProfileSnapshot = (account.last_snapshot as ProfileSnapshot) ?? {};
      const fields: (keyof ProfileSnapshot)[] = ["username", "display_name", "bio", "profile_image", "banner", "verified"];
      const prevFollowers: number | null = snapshot.followers ?? null;

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

      // Follower drop detection
      if (prevFollowers !== null && currentFollowers !== null && currentFollowers < prevFollowers) {
        const drop = prevFollowers - currentFollowers;
        const dropPct = drop / prevFollowers;
        if (drop >= 50 || dropPct >= 0.05) {
          await supabase.from("alerts").insert([{
            user_id: account.user_id,
            event_type: "followers",
            old_data: { followers: prevFollowers },
            new_data: { followers: currentFollowers },
          }]);

          const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
          const email = userData?.user?.email;

          if (email && resendKey) {
            await sendEmailAlert(resendKey, email, "followers", prevFollowers, currentFollowers);
          }
          if (account.push_enabled && account.push_token && oneSignalAppId && oneSignalKey) {
            await sendPushAlert(oneSignalAppId, oneSignalKey, account.push_token, "followers", prevFollowers, currentFollowers);
          }

          changed.push("followers");
        }
      }

      // Update snapshot + last_checked_at always
      await supabase
        .from("connected_accounts")
        .update({
          last_snapshot: current,
          followers_count: currentFollowers,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (changed.length > 0) {
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
