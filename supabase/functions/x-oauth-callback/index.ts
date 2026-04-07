import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) throw new Error("Unauthorized");
    const userId = userData.user.id;

    const { code, state } = await req.json();
    if (!code || !state) throw new Error("Missing code or state");

    // Verify state belongs to this user
    const { data: oauthState, error: stateError } = await supabase
      .from("x_oauth_states")
      .select("*")
      .eq("state", state)
      .eq("user_id", userId)
      .single();

    if (stateError || !oauthState) throw new Error("Invalid or expired OAuth state");

    const clientId = Deno.env.get("X_CLIENT_ID");
    const clientSecret = Deno.env.get("X_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("X OAuth credentials not configured");

    const appUrl = Deno.env.get("APP_URL") ?? "https://xsentinel.dev";
    const redirectUri = `${appUrl}/auth/x/callback`;

    // Exchange code for access token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error("Token exchange failed: " + err);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch X user profile
    const profileRes = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,description,name,username,profile_banner_url,verified",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!profileRes.ok) {
      const err = await profileRes.text();
      throw new Error("Failed to fetch X profile: " + err);
    }

    const profileData = await profileRes.json();
    const xUser = profileData.data;

    // Build initial profile snapshot (must match all fields polled in poll-profiles)
    const snapshot = {
      username: xUser.username,
      display_name: xUser.name,
      bio: xUser.description ?? "",
      profile_image: xUser.profile_image_url?.replace("_normal", "") ?? null,
      banner: xUser.profile_banner_url ?? null,
      verified: xUser.verified ?? false,
    };

    // Upsert connected_accounts (service role bypasses the trigger restriction)
    const { data: account, error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          x_user_id: xUser.id,
          x_username: xUser.username,
          x_display_name: xUser.name,
          x_avatar_url: xUser.profile_image_url?.replace("_normal", "") ?? null,
          last_snapshot: snapshot,
          x_access_token: tokenData.access_token,
          x_refresh_token: tokenData.refresh_token ?? null,
          subscription_status: "trial",
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (upsertError) throw new Error("Failed to save account: " + upsertError.message);

    // Clean up consumed OAuth state
    await supabase.from("x_oauth_states").delete().eq("id", oauthState.id);

    return new Response(JSON.stringify({ account }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
