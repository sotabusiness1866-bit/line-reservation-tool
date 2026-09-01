import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAvailableSlots } from "@/lib/availability";
import { jstWeekday } from "@/lib/utils/date";
import { getBusinessHour, getReservedIntervals, isClosedDate } from "@/lib/reservations-service";

const querySchema = z.object({
  menuId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    menuId: searchParams.get("menuId"),
    date: searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "パラメータが不正です" }, { status: 400 });
  }
  const { menuId, date } = parsed.data;

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

  const weekday = jstWeekday(date);
  const [businessHour, closed, reservedIntervals] = await Promise.all([
    getBusinessHour(weekday),
    isClosedDate(date),
    getReservedIntervals(date),
  ]);

  const slots = getAvailableSlots({
    dateStr: date,
    weekday,
    durationMinutes: menu.duration_minutes,
    businessHour,
    isClosedDate: closed,
    reservedIntervals,
  });

  return NextResponse.json({
    menu: {
      id: menu.id,
      name: menu.name,
      durationMinutes: menu.duration_minutes,
      price: menu.price,
    },
    date,
    slots,
  });
}
