import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { menuUpsertSchema } from "@/lib/validation";

export async function GET() {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menus: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = menuUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("menus")
    .insert({
      name: input.name,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes,
      price: input.price ?? null,
      is_active: input.isActive ?? true,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}
