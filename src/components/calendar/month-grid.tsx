import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DayCell } from "@/lib/calendar-dates";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({ cells, entryDates }: { cells: DayCell[]; entryDates: Set<string> }) {
  return (
    <div className="flex flex-col gap-1 sm:gap-2">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell) => (
          <Link
            key={cell.iso}
            href={`/calendar/${cell.year}/${cell.month}/day/${cell.day}`}
            className={cn(
              "flex aspect-square flex-col items-center justify-start gap-1 rounded-xl p-2 ring-1 ring-foreground/10 transition-colors hover:bg-muted",
              !cell.isCurrentMonth && "text-muted-foreground/40"
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-sm",
                cell.isToday && "bg-primary font-semibold text-primary-foreground"
              )}
            >
              {cell.day}
            </span>
            {entryDates.has(cell.iso) && <span className="size-1.5 rounded-full bg-primary" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
