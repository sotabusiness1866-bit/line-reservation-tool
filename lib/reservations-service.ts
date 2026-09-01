import { createServiceRoleClient } from "@/lib/supabase/server";
import { toJstDate, type BusinessHourRow, type ReservedInterval } from "@/lib/availability";

export async function getBusinessHour(weekday: number): Promise<BusinessHourRow | undefined> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("business_hours")
    .select("weekday, is_closed, open_time, close_time")
    .eq("weekday", weekday)
    .maybeSingle();

  if (error) {
    console.error("[reservations-service] 営業時間の取得に失敗:", error.message);
    return undefined;
  }
  return data ?? undefined;
}

export async function isClosedDate(dateStr: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("closed_dates")
    .select("date")
    .eq("date", dateStr)
    .maybeSingle();

  if (error) {
    console.error("[reservations-service] 休業日の取得に失敗:", error.message);
    return false;
  }
  return !!data;
}

export async function getReservedIntervals(dateStr: string): Promise<ReservedInterval[]> {
  const supabase = createServiceRoleClient();
  const dayStart = toJstDate(dateStr, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const rangeLiteral = `[${dayStart.toISOString()},${dayEnd.toISOString()})`;

  const { data, error } = await supabase
    .from("reservations")
    .select("start_at, end_at")
    .eq("status", "confirmed")
    .filter("time_range", "ov", rangeLiteral);

  if (error) {
    console.error("[reservations-service] 既存予約の取得に失敗:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    start: new Date(row.start_at),
    end: new Date(row.end_at),
  }));
}
