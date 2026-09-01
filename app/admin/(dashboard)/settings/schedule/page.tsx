"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface BusinessHourRow {
  weekday: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface ClosedDateRow {
  date: string;
  reason: string | null;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

async function fetchSchedule(): Promise<{ hours: BusinessHourRow[]; closedDates: ClosedDateRow[] }> {
  const [hRes, cRes] = await Promise.all([
    fetch("/api/admin/business-hours"),
    fetch("/api/admin/closed-dates"),
  ]);
  const hJson = await hRes.json();
  const cJson = await cRes.json();
  return { hours: hJson.businessHours ?? [], closedDates: cJson.closedDates ?? [] };
}

export default function AdminScheduleSettingsPage() {
  const [hours, setHours] = useState<BusinessHourRow[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDateRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  async function reloadAll() {
    const { hours, closedDates } = await fetchSchedule();
    setHours(hours);
    setClosedDates(closedDates);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { hours, closedDates } = await fetchSchedule();
      if (!cancelled) {
        setHours(hours);
        setClosedDates(closedDates);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveHour(row: BusinessHourRow) {
    await fetch("/api/admin/business-hours", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekday: row.weekday,
        isClosed: row.is_closed,
        openTime: row.open_time,
        closeTime: row.close_time,
      }),
    });
  }

  function updateRow(weekday: number, patch: Partial<BusinessHourRow>) {
    setHours((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  }

  async function handleAddClosedDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    await fetch("/api/admin/closed-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason || null }),
    });
    setNewDate("");
    setNewReason("");
    reloadAll();
  }

  async function handleRemoveClosedDate(date: string) {
    await fetch(`/api/admin/closed-dates?date=${date}`, { method: "DELETE" });
    reloadAll();
  }

  if (loading) return <p className="text-sm text-gray-500">読み込み中…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-gray-900">空き枠設定</h1>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">営業時間（曜日ごと）</h2>
        <Card className="flex flex-col divide-y divide-gray-100">
          {hours.map((row) => (
            <div key={row.weekday} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-6 font-medium text-gray-900">{WEEKDAY_LABELS[row.weekday]}</span>

              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={row.is_closed}
                  onChange={(e) => updateRow(row.weekday, { is_closed: e.target.checked })}
                />
                定休日
              </label>

              {!row.is_closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.open_time?.slice(0, 5) ?? ""}
                    onChange={(e) => updateRow(row.weekday, { open_time: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-gray-400">〜</span>
                  <input
                    type="time"
                    value={row.close_time?.slice(0, 5) ?? ""}
                    onChange={(e) => updateRow(row.weekday, { close_time: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              )}

              <Button size="sm" variant="secondary" onClick={() => saveHour(row)} className="ml-auto">
                保存
              </Button>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">臨時休業日</h2>
        <Card className="flex flex-col gap-3">
          <form onSubmit={handleAddClosedDate} className="flex flex-wrap items-end gap-3">
            <Input
              label="日付"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <Input
              label="理由（任意）"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="年末年始休業"
            />
            <Button type="submit">追加</Button>
          </form>

          <div className="flex flex-col gap-2">
            {closedDates.length === 0 && (
              <p className="text-sm text-gray-500">臨時休業日は登録されていません。</p>
            )}
            {closedDates.map((cd) => (
              <div key={cd.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-900">
                  {cd.date}
                  {cd.reason && <span className="ml-2 text-gray-500">{cd.reason}</span>}
                </span>
                <button
                  onClick={() => handleRemoveClosedDate(cd.date)}
                  className="text-xs text-red-600 hover:underline"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
