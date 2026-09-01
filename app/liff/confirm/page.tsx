"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useLiff } from "@/lib/line/LiffProvider";
import { formatDateJa } from "@/lib/utils/date";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">読み込み中…</p>}>
      <ConfirmContent />
    </Suspense>
  );
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuId = searchParams.get("menuId");
  const dateStr = searchParams.get("date");
  const time = searchParams.get("time");

  const liffState = useLiff();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!menuId || !dateStr || !time) {
    return <p className="text-sm text-red-600">日時を選び直してください。</p>;
  }

  if (liffState.status === "error") {
    return <p className="text-sm text-red-600">{liffState.errorMessage}</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (liffState.status !== "ready" || !liffState.userId) return;

    setStatus("submitting");
    setErrorMessage("");

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuId,
        dateStr,
        startTime: time,
        customerName,
        phone,
        lineUserId: liffState.userId,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(json.error ?? "予約に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    const r = json.reservation;
    router.push(
      `/liff/complete?menuName=${encodeURIComponent(r.menuName)}&date=${r.dateStr}&time=${r.startTime}`
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-bold text-gray-900">予約内容の確認</h1>
      </header>

      <Card className="flex flex-col gap-1">
        <p className="text-sm text-gray-500">ご希望日時</p>
        <p className="font-semibold text-gray-900">
          {formatDateJa(dateStr)} {time}〜
        </p>
      </Card>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="お名前"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="山田 太郎"
          required
        />
        <Input
          label="電話番号"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09012345678"
          required
        />

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={status === "submitting" || liffState.status !== "ready"}
        >
          {status === "submitting" ? "予約中…" : "この内容で予約する"}
        </Button>
      </form>
    </div>
  );
}
