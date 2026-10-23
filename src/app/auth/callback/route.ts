import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/features/auth/lib/supabase/server";
import { safeInternalPath } from "@/features/auth/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    const providerError = request.nextUrl.searchParams.get("error");
    return NextResponse.redirect(
      new URL(
        `/login?error=${providerError ? "oauth" : "auth-callback"}`,
        request.url,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth-callback", request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
