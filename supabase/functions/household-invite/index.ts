import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://finance-beige-chi.vercel.app",
]);

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://finance-beige-chi.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST" || !allowedOrigins.has(origin)) {
    return Response.json({ error: "Origin or method not allowed" }, { status: 403, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  let publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!publishableKey && publishableKeys) {
    try {
      publishableKey = JSON.parse(publishableKeys).default;
    } catch {
      publishableKey = undefined;
    }
  }
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  let adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  if (!adminKey && secretKeys) {
    try {
      adminKey = JSON.parse(secretKeys).default;
    } catch {
      adminKey = undefined;
    }
  }

  if (!authorization || !url || !publishableKey || !adminKey) {
    return Response.json({ error: "Function is not configured" }, { status: 500, headers: corsHeaders });
  }

  let input: { spaceId?: string; householdId?: string; email?: string };
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders });
  }

  const spaceId = input.spaceId ?? input.householdId ?? "";
  const email = (input.email ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(spaceId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Space and valid email are required" }, { status: 400, headers: corsHeaders });
  }

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user?.email) {
    return Response.json({ error: "Sign in is required" }, { status: 401, headers: corsHeaders });
  }

  if (user.email.toLowerCase() === email) {
    return Response.json({ error: "You cannot invite your own email" }, { status: 400, headers: corsHeaders });
  }

  const { data: membership } = await adminClient
    .from("space_members")
    .select("member_role")
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.member_role !== "owner") {
    return Response.json({ error: "Only the space owner can invite members" }, { status: 403, headers: corsHeaders });
  }

  const { data: existing } = await adminClient
    .from("space_invitations")
    .select("id")
    .eq("space_id", spaceId)
    .eq("invited_email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return Response.json({ error: "An active invitation already exists for this email" }, { status: 409, headers: corsHeaders });
  }

  const { data: invitation, error: insertError } = await adminClient
    .from("space_invitations")
    .insert({
      space_id: spaceId,
      invited_email: email,
      invited_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !invitation) {
    return Response.json({ error: "Could not create invitation" }, { status: 500, headers: corsHeaders });
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/space`,
    data: { space_invitation_id: invitation.id, household_invitation_id: invitation.id },
  });

  if (inviteError) {
    await adminClient
      .from("space_invitations")
      .update({ status: "revoked" })
      .eq("id", invitation.id);
    return Response.json({ error: "Could not send invitation email" }, { status: 422, headers: corsHeaders });
  }

  return Response.json({ invitationId: invitation.id }, { status: 200, headers: corsHeaders });
});
