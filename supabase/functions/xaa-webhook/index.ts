import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileSnapshot {
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  banner?: string;
}

// TODO: Wire up OneSignal/FCM
async function sendPushNotification(token: string, title: string, body: string) {
  console.log(`[PUSH PLACEHOLDER] token=${token}, title=${title}, body=${body}`);
  // TODO: call OneSignal/FCM here
}

async function sendEmailAlert(email: string, eventType: string, oldVal: string, newVal: string) {
  console.log(`[EMAIL PLACEHOLDER] to=${email}, event=${eventType}, old=${oldVal}, new=${newVal}`);
  // TODO: integrate with email service (Resend, SendGrid, etc.)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload = await req.json();

    // Expected payload from X Activity API:
    // { x_user_id: string, profile: { username, display_name, bio, profile_image, banner } }
    const { x_user_id, profile } = payload;

    if (!x_user_id || !profile) {
      return new Response(JSON.stringify({ error: "Missing x_user_id or profile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up connected account
    const { data: account, error: accError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("x_user_id", x_user_id)
      .maybeSingle();

    if (accError || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription status — skip alerts if expired
    if (account.subscription_status === "expired") {
      return new Response(JSON.stringify({ message: "Subscription expired, skipping alert" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot: ProfileSnapshot = (account.last_snapshot as ProfileSnapshot) || {};
    const changes: { event_type: string; old_data: any; new_data: any }[] = [];

    // Compare each field
    const fields: (keyof ProfileSnapshot)[] = ["username", "display_name", "bio", "profile_image", "banner"];
    for (const field of fields) {
      if (profile[field] !== undefined && profile[field] !== snapshot[field]) {
        changes.push({
          event_type: field,
          old_data: { [field]: snapshot[field] || null },
          new_data: { [field]: profile[field] },
        });
      }
    }

    if (changes.length === 0) {
      return new Response(JSON.stringify({ message: "No changes detected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create alerts
    const alertInserts = changes.map((c) => ({
      user_id: account.user_id,
      event_type: c.event_type,
      old_data: c.old_data,
      new_data: c.new_data,
    }));

    await supabase.from("alerts").insert(alertInserts);

    // Update snapshot
    const newSnapshot = { ...snapshot, ...profile };
    await supabase
      .from("connected_accounts")
      .update({ last_snapshot: newSnapshot })
      .eq("id", account.id);

    // Send notifications
    // Get user email from auth
    const { data: userData } = await supabase.auth.admin.getUserById(account.user_id);
    const email = userData?.user?.email;

    for (const change of changes) {
      // Email notification
      if (email) {
        await sendEmailAlert(
          email,
          change.event_type,
          JSON.stringify(change.old_data),
          JSON.stringify(change.new_data)
        );
      }

      // Push notification (if enabled and token exists)
      if (account.push_enabled && account.push_token) {
        await sendPushNotification(
          account.push_token,
          "⚠️ XGuard Alert",
          `Your ${change.event_type.replace("_", " ")} was changed`
        );
      }
    }

    return new Response(JSON.stringify({ message: `${changes.length} alert(s) created` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
