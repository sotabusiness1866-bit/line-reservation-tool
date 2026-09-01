import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { todayJstDateStr } from "@/lib/utils/date";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const todayStr = todayJstDateStr();
  const dayStart = new Date(`${todayStr}T00:00:00+09:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, customer_name, start_at, status, menus(name)")
    .eq("status", "confirmed")
    .gte("start_at", dayStart.toISOString())
    .lt("start_at", dayEnd.toISOString())
    .order("start_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">本日 {todayStr} の予約状況</p>
      </div>

      <Card>
        <p className="text-sm text-gray-500">本日の予約件数</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{reservations?.length ?? 0}件</p>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">本日の予約一覧</h2>
        {error && <p className="text-sm text-red-600">取得に失敗しました。</p>}
        {!error && (!reservations || reservations.length === 0) && (
          <p className="text-sm text-gray-500">本日の予約はありません。</p>
        )}
        <div className="flex flex-col gap-2">
          {reservations?.map((r) => (
            <Link key={r.id} href={`/admin/reservations/${r.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{r.customer_name} 様</p>
                  <p className="text-sm text-gray-500">{r.menus?.name}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(r.start_at).toLocaleTimeString("ja-JP", {
                    timeZone: "Asia/Tokyo",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
