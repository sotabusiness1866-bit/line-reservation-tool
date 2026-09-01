import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { menuUpsertSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = menuUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("menus")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.durationMinutes !== undefined && { duration_minutes: input.durationMinutes }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu: data });
}
