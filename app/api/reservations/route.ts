import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildTimeRange, getAvailableSlots } from "@/lib/availability";
import { formatDateJa, jstWeekday } from "@/lib/utils/date";
import { getBusinessHour, getReservedIntervals, isClosedDate } from "@/lib/reservations-service";
import { sendLineMessage } from "@/lib/line/messaging";
import { verifyLiffIdToken } from "@/lib/line/verify";
import { reservationCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reservationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が正しくありません", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { menuId, dateStr, startTime, customerName, phone, idToken } = parsed.data;

  // クライアントが自己申告するlineUserIdを信用せず、LINEに問い合わせて本物のユーザーIDを取得する
  const lineUserId = await verifyLiffIdToken(idToken);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "LINE認証の確認に失敗しました。LINEアプリから開き直してもう一度お試しください。" },
      { status: 401 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("id, name, duration_minutes, price")
    .eq("id", menuId)
    .eq("is_active", true)
    .maybeSingle();

  if (menuError || !menu) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }

  // クライアントから渡された時刻を信用せず、サーバー側で改めて予約可能かを検証する
  const weekday = jstWeekday(dateStr);
  const [businessHour, closed, reservedIntervals] = await Promise.all([
    getBusinessHour(weekday),
    isClosedDate(dateStr),
    getReservedIntervals(dateStr),
  ]);

  const availableSlots = getAvailableSlots({
    dateStr,
    weekday,
    durationMinutes: menu.duration_minutes,
    businessHour,
    isClosedDate: closed,
    reservedIntervals,
  });

  if (!availableSlots.includes(startTime)) {
    return NextResponse.json(
      { error: "その時間帯はすでに予約できなくなっています。別の時間を選んでください。" },
      { status: 409 }
    );
  }

  const timeRange = buildTimeRange(dateStr, startTime, menu.duration_minutes);

  const { data: reservation, error: insertError } = await supabase
    .from("reservations")
    .insert({
      menu_id: menu.id,
      line_user_id: lineUserId,
      customer_name: customerName,
      phone,
      time_range: timeRange,
    })
    .select("id")
    .single();

  if (insertError) {
    // exclusion constraint違反(同時アクセスによる二重予約)はPostgresエラーコード23P01
    if (insertError.code === "23P01") {
      return NextResponse.json(
        { error: "その時間帯はちょうど埋まってしまいました。別の時間を選んでください。" },
        { status: 409 }
      );
    }
    console.error("[api/reservations] 予約作成に失敗:", insertError.message);
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 });
  }

  const dateLabel = formatDateJa(dateStr);
  sendLineMessage(
    lineUserId,
    `ご予約ありがとうございます。\n\n■${menu.name}\n${dateLabel} ${startTime}〜\n\n当日のご来店をお待ちしております。`
  ).catch((err) => console.error("[api/reservations] 確定通知の送信に失敗:", err));

  return NextResponse.json({
    reservation: {
      id: reservation.id,
      menuName: menu.name,
      price: menu.price,
      dateStr,
      startTime,
      durationMinutes: menu.duration_minutes,
    },
  });
}
