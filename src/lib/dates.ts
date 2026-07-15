export const TAIPEI_TZ = "Asia/Taipei";

/** Hourly slots 08:00-18:00, matching the old app's fixed booking grid. */
export const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export const PURPOSE_OPTIONS = ["教學", "研習", "會議", "其他"] as const;

/** Returns true if [aStart, aEnd) overlaps [bStart, bEnd), given "HH:MM" strings. */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return !(aEnd <= bStart || aStart >= bEnd);
}

export function todayInTaipei(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TAIPEI_TZ }); // sv-SE => YYYY-MM-DD
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 || day === 6;
}

/** HH:MM:SS -> HH:MM for display. */
export function shortTime(time: string): string {
  return time.slice(0, 5);
}
