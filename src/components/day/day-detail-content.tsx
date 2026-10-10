import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dayIso, dayLabel, isValidCalendarDate } from "@/lib/calendar-dates";
import { getVisibleEntriesForDate } from "@/lib/day-entries";
import { getPresignedViewUrl } from "@/lib/r2";
import { AddEntryForm } from "@/components/day/add-entry-form";

export async function DayDetailContent({ year, month, day }: { year: number; month: number; day: number }) {
  if (!isValidCalendarDate(year, month, day)) redirect("/calendar");

  const session = await auth();
  const dateIso = dayIso(year, month, day);
  const todayIso = new Date().toISOString().slice(0, 10);
  const isFuture = dateIso > todayIso;

  const entries = await getVisibleEntriesForDate(session!.user.id, dateIso);

  const entriesWithUrls = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      photos: await Promise.all(
        entry.photos.map(async (photo) => ({
          ...photo,
          url: await getPresignedViewUrl(photo.storageUrl),
        }))
      ),
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold">{dayLabel(year, month, day)}</h2>

      {entriesWithUrls.length === 0 && (
        <p className="text-sm text-muted-foreground">No entries yet for this day.</p>
      )}

      {entriesWithUrls.map((entry) => (
        <div key={entry.id} className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0">
          <span className="text-sm font-medium">
            {entry.authorId === session!.user.id ? "You" : entry.author.displayName}
          </span>
          {entry.note && <p className="text-sm">{entry.note}</p>}
          {entry.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {entry.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {isFuture ? (
        <p className="text-sm text-muted-foreground">Future date — come back once it&apos;s here.</p>
      ) : (
        <AddEntryForm dateIso={dateIso} />
      )}
    </div>
  );
}
