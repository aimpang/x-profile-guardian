import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

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

    // Generate PKCE code_verifier (64 random bytes → base64url)
    const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
    const codeVerifier = toBase64Url(verifierBytes);

    // Derive code_challenge = BASE64URL(SHA-256(code_verifier))
    const challengeBytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier)
    );
    const codeChallenge = toBase64Url(new Uint8Array(challengeBytes));

    // Generate state
    const state = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));

    // Store PKCE state in x_oauth_states
    const { error: insertError } = await supabase
      .from("x_oauth_states")
      .insert({ user_id: userId, state, code_verifier: codeVerifier });

    if (insertError) throw new Error("Failed to store OAuth state: " + insertError.message);

    const clientId = Deno.env.get("X_CLIENT_ID");
    if (!clientId) throw new Error("X_CLIENT_ID is not configured");

    const appUrl = Deno.env.get("APP_URL") ?? "https://xsentinel.dev";
    const redirectUri = `${appUrl}/auth/x/callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "tweet.read users.read offline.access",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const url = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    return new Response(JSON.stringify({ url }), {
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
