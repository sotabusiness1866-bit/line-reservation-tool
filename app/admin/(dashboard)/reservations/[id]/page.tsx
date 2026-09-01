import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CancelReservationButton } from "@/components/admin/CancelReservationButton";
import { formatYen } from "@/lib/utils/date";

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*, menus(name, duration_minutes, price)")
    .eq("id", id)
    .single();

  if (error || !reservation) notFound();

  const startAt = new Date(reservation.start_at);
  const dateLabel = startAt.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeLabel = startAt.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">予約詳細</h1>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">ステータス</span>
          <span
            className={
              reservation.status === "confirmed"
                ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                : "rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
            }
          >
            {reservation.status === "confirmed" ? "確定" : "キャンセル済"}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500">日時</p>
          <p className="font-medium text-gray-900">
            {dateLabel} {timeLabel}〜
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">メニュー</p>
          <p className="font-medium text-gray-900">
            {reservation.menus?.name}（{reservation.menus?.duration_minutes}分・
            {formatYen(reservation.menus?.price)}）
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">お客様</p>
          <p className="font-medium text-gray-900">{reservation.customer_name} 様</p>
          <p className="text-sm text-gray-500">{reservation.phone}</p>
        </div>
      </Card>

      {reservation.status === "confirmed" && (
        <CancelReservationButton reservationId={reservation.id} />
      )}
    </div>
  );
}
