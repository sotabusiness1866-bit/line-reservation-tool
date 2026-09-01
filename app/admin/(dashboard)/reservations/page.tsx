"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { todayJstDateStr } from "@/lib/utils/date";

interface ReservationRow {
  id: string;
  customer_name: string;
  phone: string;
  status: "confirmed" | "cancelled";
  start_at: string;
  end_at: string;
  menus: { name: string } | null;
}

async function fetchReservations(date: string): Promise<ReservationRow[]> {
  const res = await fetch(`/api/admin/reservations?date=${date}`);
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.reservations ?? [];
}

export default function AdminReservationsPage() {
  const [date, setDate] = useState(todayJstDateStr());
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      try {
        const rows = await fetchReservations(date);
        if (!cancelled) {
          setReservations(rows);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">予約管理</h1>
      </div>

      <label className="flex max-w-xs flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">日付</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>

      {status === "loading" && <p className="text-sm text-gray-500">読み込み中…</p>}
      {status === "error" && <p className="text-sm text-red-600">取得に失敗しました。</p>}

      {status === "idle" && reservations.length === 0 && (
        <p className="text-sm text-gray-500">この日の予約はありません。</p>
      )}

      <div className="flex flex-col gap-2">
        {reservations.map((r) => (
          <Link key={r.id} href={`/admin/reservations/${r.id}`}>
            <Card className="flex items-center justify-between transition-colors hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">
                  {r.customer_name} 様
                  {r.status === "cancelled" && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      キャンセル済
                    </span>
                  )}
                </p>
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
  );
}
