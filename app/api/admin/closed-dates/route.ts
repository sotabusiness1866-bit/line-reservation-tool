import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { closedDateCreateSchema } from "@/lib/validation";

export async function GET() {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { data, error } = await supabase
    .from("closed_dates")
    .select("*")
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ closedDates: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = closedDateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("closed_dates")
    .upsert({ date: input.date, reason: input.reason ?? null })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ closedDate: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "dateが必要です" }, { status: 400 });

  const { error } = await supabase.from("closed_dates").delete().eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
