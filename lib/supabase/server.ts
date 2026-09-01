import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// 認証済みユーザー(店舗スタッフ)としてRLSを通す用。管理画面のServer Component/API Routeから使う
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Componentから呼ばれた場合はcookie書き込みができないが、
            // proxy.tsがセッションリフレッシュを担うため無視してよい
          }
        },
      },
    }
  );
}

// RLSを越えて操作する必要がある処理（予約作成・空き枠計算・リマインド送信）専用。
// 顧客側(LIFF)は認証を持たないため、予約作成APIはこのクライアントで行う
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
