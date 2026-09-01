"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatYen, todayJstDateStr } from "@/lib/utils/date";

interface AvailabilityResponse {
  menu: { id: string; name: string; durationMinutes: number; price: number | null };
  date: string;
  slots: string[];
}

async function fetchAvailability(menuId: string, date: string): Promise<AvailabilityResponse> {
  const res = await fetch(`/api/availability?menuId=${menuId}&date=${date}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">読み込み中…</p>}>
      <ScheduleContent />
    </Suspense>
  );
}

function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuId = searchParams.get("menuId");

  const [date, setDate] = useState(todayJstDateStr());
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!menuId) return;
    let cancelled = false;

    (async () => {
      setStatus("loading");
      try {
        const json = await fetchAvailability(menuId, date);
        if (!cancelled) {
          setData(json);
          setStatus("idle");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [menuId, date]);

  if (!menuId) {
    return <p className="text-sm text-red-600">メニューを選び直してください。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-900">日時を選んでください</h1>
        {data && (
          <p className="mt-1 text-sm text-gray-500">
            {data.menu.name}（{data.menu.durationMinutes}分・{formatYen(data.menu.price)}）
          </p>
        )}
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">日付</span>
        <input
          type="date"
          value={date}
          min={todayJstDateStr()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>

      {status === "loading" && <p className="text-sm text-gray-500">空き状況を確認しています…</p>}
      {status === "error" && (
        <p className="text-sm text-red-600">空き状況の取得に失敗しました。時間をおいて再度お試しください。</p>
      )}

      {status === "idle" && data && data.slots.length === 0 && (
        <Card>
          <p className="text-sm text-gray-600">この日は空きがありません。別の日を選んでください。</p>
        </Card>
      )}

      {status === "idle" && data && data.slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {data.slots.map((slot) => (
            <Button
              key={slot}
              variant="secondary"
              onClick={() =>
                router.push(`/liff/confirm?menuId=${menuId}&date=${date}&time=${slot}`)
              }
            >
              {slot}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
