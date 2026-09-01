"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/reservations", label: "予約管理" },
  { href: "/admin/settings/menu", label: "メニュー設定" },
  { href: "/admin/settings/schedule", label: "空き枠設定" },
  { href: "/admin/settings/account", label: "アカウント設定" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
