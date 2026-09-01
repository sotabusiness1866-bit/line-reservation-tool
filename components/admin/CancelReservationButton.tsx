"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("この予約をキャンセルしますか？お客様にLINEでキャンセルの連絡が届きます。")) return;

    setLoading(true);
    const res = await fetch(`/api/admin/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setLoading(false);

    if (!res.ok) {
      alert("キャンセル処理に失敗しました。");
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleCancel} disabled={loading}>
      {loading ? "処理中…" : "予約をキャンセルする"}
    </Button>
  );
}
