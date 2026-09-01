import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { sendLineMessage } from "@/lib/line/messaging";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("reservations")
    .select("*, menus(name, duration_minutes, price)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ reservation: data });
}

// 店舗側からの予約キャンセル（F-11）
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.status !== "cancelled") {
    return NextResponse.json({ error: "statusはcancelledのみ指定できます" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, menus(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const startAt = new Date(data.start_at);
  const dateLabel = startAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
  const timeLabel = startAt.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
  sendLineMessage(
    data.line_user_id,
    `店舗都合により、下記のご予約をキャンセルさせていただきました。\n\n■${data.menus?.name ?? ""}\n${dateLabel} ${timeLabel}〜\n\nご不便をおかけして申し訳ございません。`
  ).catch((err) => console.error("[api/admin/reservations] キャンセル通知の送信に失敗:", err));

  return NextResponse.json({ reservation: data });
}
