import { addMinutes, areIntervalsOverlapping, isBefore } from "date-fns";

// 店舗の営業タイムゾーンは日本国内の実店舗のみを想定するため、常にJST(+09:00)で計算する
export const STORE_TIMEZONE_OFFSET = "+09:00";

export const SLOT_INTERVAL_MINUTES = 30;

export interface BusinessHourRow {
  weekday: number;
  is_closed: boolean;
  open_time: string | null; // "HH:mm:ss"
  close_time: string | null;
}

export interface ReservedInterval {
  start: Date;
  end: Date;
}

function toJstDate(dateStr: string, time: string): Date {
  // time: "HH:mm" or "HH:mm:ss"
  const hhmmss = time.length === 5 ? `${time}:00` : time;
  return new Date(`${dateStr}T${hhmmss}${STORE_TIMEZONE_OFFSET}`);
}

// date-fnsのformatはサーバーのローカルタイムゾーン(Vercel上ではUTC)に依存してしまうため、
// JST表示にはIntl.DateTimeFormatでタイムゾーンを明示する
function formatJstTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/**
 * 指定日・指定メニュー(所要時間)について、予約可能な開始時刻の一覧を "HH:mm" の配列で返す。
 * 営業時間外、定休日、既存予約と重なる枠、過去の時刻は除外する。
 */
export function getAvailableSlots(params: {
  dateStr: string; // "yyyy-MM-dd"
  weekday: number; // 0=日〜6=土
  durationMinutes: number;
  businessHour: BusinessHourRow | undefined;
  isClosedDate: boolean;
  reservedIntervals: ReservedInterval[];
  now?: Date;
}): string[] {
  const { dateStr, durationMinutes, businessHour, isClosedDate, reservedIntervals } = params;
  const now = params.now ?? new Date();

  if (isClosedDate || !businessHour || businessHour.is_closed) return [];
  if (!businessHour.open_time || !businessHour.close_time) return [];

  const openAt = toJstDate(dateStr, businessHour.open_time);
  const closeAt = toJstDate(dateStr, businessHour.close_time);

  const slots: string[] = [];
  let cursor = openAt;

  while (true) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (isBefore(closeAt, slotEnd)) break;

    const isPast = isBefore(cursor, now);
    const overlapsExisting = reservedIntervals.some((interval) =>
      areIntervalsOverlapping(
        { start: cursor, end: slotEnd },
        { start: interval.start, end: interval.end }
      )
    );

    if (!isPast && !overlapsExisting) {
      slots.push(formatJstTime(cursor));
    }

    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

export function buildTimeRange(dateStr: string, startTime: string, durationMinutes: number) {
  const start = toJstDate(dateStr, startTime);
  const end = addMinutes(start, durationMinutes);
  // Postgres tstzrange リテラル（両端ともISO文字列。下限含む/上限含まない）
  return `[${start.toISOString()},${end.toISOString()})`;
}

export { toJstDate };
