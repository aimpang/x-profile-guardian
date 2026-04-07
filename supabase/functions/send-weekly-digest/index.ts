import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-digest-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: digest secret or service role
  const digestSecret = Deno.env.get("DIGEST_SECRET");
  const incomingSecret = req.headers.get("x-digest-secret");
  const authHeader = req.headers.get("authorization") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const valid = (digestSecret && incomingSecret === digestSecret) ||
    authHeader === `Bearer ${serviceRoleKey}`;

  if (!valid) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response("RESEND_API_KEY not set", { status: 500, headers: corsHeaders });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all active/trial accounts
  const { data: accounts, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .neq("subscription_status", "expired");

  if (error) {
    console.error("Failed to fetch accounts:", error);
    return new Response("DB error", { status: 500, headers: corsHeaders });
  }

  const results: string[] = [];

  for (const account of accounts ?? []) {
    try {
      // Fetch this week's alerts
      const { data: weekAlerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", account.user_id)
        .gte("created_at", oneWeekAgo)
        .order("created_at", { ascending: false });

      const alertCount = weekAlerts?.length ?? 0;
      const acknowledgedCount = weekAlerts?.filter((a: any) => a.is_legitimate).length ?? 0;
      const unacknowledgedCount = alertCount - acknowledgedCount;

      // Follower delta (current vs 7 days ago — best we can do is current count)
      const currentFollowers = account.followers_count ?? null;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      // Calculate polls this week (1 per minute = 10,080/week)
      const pollsThisWeek = (7 * 24 * 60).toLocaleString();

      // Build alert summary HTML
      const alertSummaryHtml = alertCount === 0
        ? `<p style="color:#22c55e;font-weight:600;">No changes detected this week.</p>`
        : `
          <p style="color:#111;margin:0 0 8px;">
            <strong>${alertCount}</strong> change${alertCount !== 1 ? "s" : ""} detected
            ${unacknowledgedCount > 0
              ? `<span style="color:#ef4444;"> — ${unacknowledgedCount} unreviewed</span>`
              : `<span style="color:#22c55e;"> — all acknowledged</span>`
            }
          </p>
          <ul style="margin:0;padding-left:20px;color:#555;font-size:13px;">
            ${weekAlerts!.map((a: any) => {
              const label = a.event_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
              const date = new Date(a.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return `<li style="margin-bottom:4px;">${label} changed — ${date}${a.is_legitimate ? ' <span style="color:#888;">(acknowledged)</span>' : ' <span style="color:#ef4444;">(unreviewed)</span>'}</li>`;
            }).join("")}
          </ul>
        `;

      const followerHtml = currentFollowers !== null
        ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;width:160px;">Followers</td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-weight:500;">${currentFollowers.toLocaleString()}</td>
          </tr>`
        : "";

      const html = `
        <div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#ffffff;">
          <div style="margin-bottom:32px;">
            <p style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin:0 0 12px;">XSentinel — Weekly Report</p>
            <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 6px;">Your weekly protection summary.</h1>
            <p style="font-size:14px;color:#555;margin:0;">Here's what happened with <strong>@${account.x_username}</strong> this week.</p>
          </div>

          <div style="background:#f9f9f9;border:1px solid #e8e8e8;border-radius:8px;padding:24px;margin-bottom:24px;">
            <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin:0 0 16px;">Account Summary</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;width:160px;">Monitoring checks</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-weight:500;">${pollsThisWeek} this week</td>
              </tr>
              ${followerHtml}
              <tr>
                <td style="padding:10px 0;color:#777;">Status</td>
                <td style="padding:10px 0;color:#22c55e;font-weight:600;">
                  ${account.subscription_status === "active" ? "Active — Protected" : "Trial — Protected"}
                </td>
              </tr>
            </table>
          </div>

          <div style="background:#f9f9f9;border:1px solid #e8e8e8;border-radius:8px;padding:24px;margin-bottom:28px;">
            <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin:0 0 16px;">Changes This Week</p>
            ${alertSummaryHtml}
          </div>

          <a href="https://xsentinel.dev/dashboard" style="display:inline-block;background:#000;color:#fff;padding:13px 28px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
            View Dashboard
          </a>

          <p style="font-size:12px;color:#aaa;margin-top:36px;line-height:1.7;border-top:1px solid #eee;padding-top:24px;">
            Weekly digest from XSentinel. Your X account @${account.x_username} is monitored every minute.<br>
            <a href="https://xsentinel.dev/dashboard" style="color:#888;">Manage preferences</a> ·
            <a href="https://xsentinel.dev/dashboard" style="color:#888;">Unsubscribe from digest</a> ·
            Reply to this email for support.
          </p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "XSentinel <digest@xsentinel.dev>",
          reply_to: "support@xsentinel.dev",
          to: [email],
          subject: alertCount === 0
            ? `@${account.x_username} — All clear this week`
            : `@${account.x_username} — ${alertCount} change${alertCount !== 1 ? "s" : ""} detected this week`,
          html,
        }),
      });

      if (res.ok) {
        results.push(`${account.x_username}: sent`);
      } else {
        const err = await res.json();
        console.error(`Resend error for ${account.x_username}:`, err);
        results.push(`${account.x_username}: failed`);
      }
    } catch (e) {
      console.error(`Error for ${account.x_username}:`, e);
      results.push(`${account.x_username}: error`);
    }
  }

  console.log("Digest results:", results);
  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
