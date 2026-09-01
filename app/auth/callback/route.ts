import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  const authError = searchParams.get("error");
  const authErrorDescription = searchParams.get("error_description");
  if (authError) {
    console.error("[auth/callback] Supabaseからのエラー:", authError, authErrorDescription);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession失敗:", error.message, error.status);
  }

  return NextResponse.redirect(`${origin}/admin/login`);
}
