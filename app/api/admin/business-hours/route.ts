import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { businessHourUpdateSchema } from "@/lib/validation";

export async function GET() {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .order("weekday", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ businessHours: data });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = businessHourUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("business_hours")
    .update({
      is_closed: input.isClosed,
      open_time: input.isClosed ? null : input.openTime ?? null,
      close_time: input.isClosed ? null : input.closeTime ?? null,
    })
    .eq("weekday", input.weekday)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ businessHour: data });
}
