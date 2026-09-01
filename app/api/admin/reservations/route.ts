import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // "yyyy-MM-dd"（省略時は全件）

  let query = supabase
    .from("reservations")
    .select("id, customer_name, phone, status, start_at, end_at, created_at, menus(name)")
    .order("start_at", { ascending: true });

  if (date) {
    const dayStart = new Date(`${date}T00:00:00+09:00`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    query = query.gte("start_at", dayStart.toISOString()).lt("start_at", dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservations: data });
}
