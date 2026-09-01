"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.code === "signup_disabled" || error.message.includes("Signups not allowed")
          ? "このメールアドレスは登録されていません。"
          : error.message
      );
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">予約管理画面</h1>
          <p className="mt-1 text-sm text-gray-500">店舗スタッフ用ログイン</p>
        </div>

        <Card>
          {status === "sent" ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-gray-900">メールを確認してください</p>
              <p className="mt-1 text-sm text-gray-500">
                {email} 宛にログイン用のリンクを送信しました。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "送信中…" : "ログインリンクを送る"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
