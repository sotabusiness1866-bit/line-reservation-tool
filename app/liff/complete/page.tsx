"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatDateJa } from "@/lib/utils/date";

export default function CompletePage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">読み込み中…</p>}>
      <CompleteContent />
    </Suspense>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const menuName = searchParams.get("menuName");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        ✓
      </div>

      <div>
        <h1 className="text-lg font-bold text-gray-900">ご予約が確定しました</h1>
        <p className="mt-1 text-sm text-gray-500">確認メッセージをLINEに送信しました</p>
      </div>

      {menuName && date && time && (
        <Card className="w-full text-left">
          <p className="text-sm text-gray-500">{menuName}</p>
          <p className="mt-1 font-semibold text-gray-900">
            {formatDateJa(date)} {time}〜
          </p>
        </Card>
      )}
    </div>
  );
}
