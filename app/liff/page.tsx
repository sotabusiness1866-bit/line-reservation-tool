import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { formatYen } from "@/lib/utils/date";

// メニューの有効/無効はいつ変わってもおかしくないため、ビルド時ではなく常にリクエスト時に取得する
export const dynamic = "force-dynamic";

export default async function LiffTopPage() {
  const supabase = createPublicClient();
  const { data: menus, error } = await supabase
    .from("menus")
    .select("id, name, description, duration_minutes, price")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-900">ご希望のメニューを選んでください</h1>
        <p className="mt-1 text-sm text-gray-500">メニュー→日時の順に選ぶだけで予約できます</p>
      </header>

      {error && (
        <p className="text-sm text-red-600">メニューの取得に失敗しました。時間をおいて再度お試しください。</p>
      )}

      {!error && (!menus || menus.length === 0) && (
        <p className="text-sm text-gray-500">現在予約可能なメニューがありません。</p>
      )}

      <div className="flex flex-col gap-3">
        {menus?.map((menu) => (
          <Link
            key={menu.id}
            href={`/liff/schedule?menuId=${menu.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors active:bg-gray-100"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{menu.name}</span>
              <span className="text-sm text-gray-500">{menu.duration_minutes}分</span>
            </div>
            {menu.description && (
              <p className="mt-1 text-sm text-gray-500">{menu.description}</p>
            )}
            <p className="mt-2 text-sm font-medium text-emerald-700">{formatYen(menu.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
