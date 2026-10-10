import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalendarHeader({
  label,
  prevHref,
  nextHref,
  todayHref,
  showToday,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  showToday: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-heading text-lg font-semibold">{label}</h1>
      <div className="flex items-center gap-1">
        {showToday && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={todayHref} />}>
            Today
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={prevHref} aria-label="Previous month" />}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={nextHref} aria-label="Next month" />}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
