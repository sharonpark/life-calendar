// Phase 2 of the build order: month grid + Day Detail.
// Route accepts an optional [[...date]] catch-all so /calendar,
// /calendar/2026/8, and eventually /calendar/2026/8/day/15 can share this
// tree, with Day Detail rendered via an intercepting @modal route. For now,
// any segments beyond [year, month] are ignored — see resolveMonthParams.
import { auth } from "@/lib/auth";
import { addMonths, getMonthGrid, monthLabel, resolveMonthParams } from "@/lib/calendar-dates";
import { getVisibleEntryDatesForMonth } from "@/lib/day-entries";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { MonthGrid } from "@/components/calendar/month-grid";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ date?: string[] }>;
}) {
  const { date } = await params;
  const session = await auth();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const { year, month } = resolveMonthParams(date, now);

  const entryDates = await getVisibleEntryDatesForMonth(session!.user.id, year, month);
  const cells = getMonthGrid(year, month, todayIso);
  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);
  const isCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1;

  return (
    <div className="flex flex-col gap-4 p-4">
      <CalendarHeader
        label={monthLabel(year, month)}
        prevHref={`/calendar/${prev.year}/${prev.month}`}
        nextHref={`/calendar/${next.year}/${next.month}`}
        todayHref="/calendar"
        showToday={!isCurrentMonth}
      />
      <MonthGrid cells={cells} entryDates={entryDates} />
    </div>
  );
}
