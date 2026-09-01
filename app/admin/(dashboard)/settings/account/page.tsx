import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function AdminAccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-gray-900">アカウント設定</h1>

      <Card>
        <p className="text-sm text-gray-500">ログイン中のメールアドレス</p>
        <p className="mt-1 font-medium text-gray-900">{user?.email}</p>
        <p className="mt-4 text-xs text-gray-400">
          ログインはメールアドレス宛のリンク（マジックリンク）方式のため、パスワードの設定・変更は不要です。
        </p>
      </Card>
    </div>
  );
}
