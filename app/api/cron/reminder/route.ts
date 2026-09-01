import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendLineMessage } from "@/lib/line/messaging";
import { formatDateJa, todayJstDateStr } from "@/lib/utils/date";

// Vercel Cronから1日1回叩かれ、翌日の確定予約に前日リマインドを送る（F-06）
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const todayStr = todayJstDateStr();
  const tomorrow = new Date(`${todayStr}T00:00:00+09:00`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(tomorrow);

  const supabase = createServiceRoleClient();
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, line_user_id, customer_name, start_at, menus(name)")
    .eq("status", "confirmed")
    .gte("start_at", tomorrow.toISOString())
    .lt("start_at", dayAfterTomorrow.toISOString());

  if (error) {
    console.error("[api/cron/reminder] 予約取得に失敗:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const r of reservations ?? []) {
    const startAt = new Date(r.start_at);
    const timeLabel = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(startAt);

    await sendLineMessage(
      r.line_user_id,
      `【ご予約のリマインド】\n明日${formatDateJa(tomorrowStr)}、ご予約をお待ちしております。\n\n■${r.menus?.name ?? ""}\n${timeLabel}〜`
    );
    sent += 1;
  }

  return NextResponse.json({ sent });
}
