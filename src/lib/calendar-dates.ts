export interface DayCell {
  iso: string; // "YYYY-MM-DD"
  year: number;
  month: number; // 1-12
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface MonthParams {
  year: number;
  month: number; // 1-12
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Reads only segments[0] (year) and segments[1] (month) — anything beyond
// (the future .../day/15 segment) is intentionally ignored, which is how a
// Day Detail URL is tolerated here without crashing before Day Detail exists.
export function resolveMonthParams(segments: string[] | undefined, now: Date = new Date()): MonthParams {
  const fallback: MonthParams = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  if (!segments || segments.length < 2) return fallback;

  const year = Number(segments[0]);
  const month = Number(segments[1]);
  if (!Number.isInteger(year) || year < 1970 || year > 9999) return fallback;
  if (!Number.isInteger(month) || month < 1 || month > 12) return fallback;

  return { year, month };
}

export function addMonths(year: number, month: number, delta: number): MonthParams {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

// Grid runs from the Sunday on/before the 1st through the Saturday on/after
// the last day of the month — a natural 4-6 rows, no forced padding.
export function getMonthGrid(year: number, month: number, todayIso?: string): DayCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));

  const gridStart = addUtcDays(firstOfMonth, -firstOfMonth.getUTCDay());
  const gridEnd = addUtcDays(lastOfMonth, 6 - lastOfMonth.getUTCDay());

  const cells: DayCell[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addUtcDays(cursor, 1)) {
    const iso = toIso(cursor);
    cells.push({
      iso,
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth() + 1,
      day: cursor.getUTCDate(),
      isCurrentMonth: cursor.getUTCMonth() === month - 1,
      isToday: iso === todayIso,
    });
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

// Rejects both malformed input (non-integers) and calendar overflow (e.g.
// month=13, day=32) — Date.UTC silently rolls those into the next unit
// instead of erroring, so round-tripping the parts back out catches it.
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function dayIso(year: number, month: number, day: number): string {
  return toIso(new Date(Date.UTC(year, month - 1, day)));
}

export function dayLabel(year: number, month: number, day: number): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
