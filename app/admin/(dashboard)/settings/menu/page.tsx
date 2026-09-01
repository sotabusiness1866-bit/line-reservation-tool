"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatYen } from "@/lib/utils/date";

interface MenuRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
  sort_order: number;
}

async function fetchMenus(): Promise<MenuRow[]> {
  const res = await fetch("/api/admin/menus");
  const json = await res.json();
  return json.menus ?? [];
}

export default function AdminMenuSettingsPage() {
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function reloadMenus() {
    setMenus(await fetchMenus());
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const rows = await fetchMenus();
      if (!cancelled) {
        setMenus(rows);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const res = await fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        durationMinutes: Number(duration),
        price: price ? Number(price) : null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json();
      setErrorMessage(json.error ?? "登録に失敗しました");
      return;
    }

    setName("");
    setDuration("60");
    setPrice("");
    reloadMenus();
  }

  async function toggleActive(menu: MenuRow) {
    await fetch(`/api/admin/menus/${menu.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !menu.is_active }),
    });
    reloadMenus();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-gray-900">メニュー設定</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">新しいメニューを追加</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input
            label="メニュー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="カット"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="所要時間（分）"
              type="number"
              min={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              label="料金（円・任意）"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "追加中…" : "メニューを追加"}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">メニュー一覧</h2>
        {loading && <p className="text-sm text-gray-500">読み込み中…</p>}
        <div className="flex flex-col gap-2">
          {menus.map((menu) => (
            <Card key={menu.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {menu.name}
                  {!menu.is_active && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      無効
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {menu.duration_minutes}分・{formatYen(menu.price)}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toggleActive(menu)}>
                {menu.is_active ? "無効にする" : "有効にする"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
