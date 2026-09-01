import { STORE_TIMEZONE_OFFSET } from "@/lib/availability";

/** "yyyy-MM-dd" のJST日付文字列から曜日(0=日〜6=土)を求める */
export function jstWeekday(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00${STORE_TIMEZONE_OFFSET}`).getUTCDay();
}

/** 今日のJST日付を "yyyy-MM-dd" で返す */
export function todayJstDateStr(): string {
  const now = new Date();
  const jstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const jst = new Date(jstMs);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const WEEKDAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"];

export function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const w = WEEKDAY_LABELS_JA[jstWeekday(dateStr)];
  return `${y}年${m}月${d}日(${w})`;
}

export function formatYen(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "料金未設定";
  return `¥${amount.toLocaleString("ja-JP")}`;
}
