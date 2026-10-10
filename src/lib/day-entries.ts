import { prisma } from "@/lib/prisma";
import type { Circle } from "@/generated/prisma/client";

async function getViewerCircles(userId: string): Promise<Set<Circle>> {
  const memberships = await prisma.circleMembership.findMany({
    where: { userId },
    select: { circle: true },
  });
  return new Set(memberships.map((m) => m.circle));
}

function visibilityOr(userId: string, circles: Set<Circle>) {
  return [
    { authorId: userId },
    ...(circles.has("FAMILY") ? [{ visibleToFamily: true }] : []),
    ...(circles.has("FRIENDS") ? [{ visibleToFriends: true }] : []),
  ];
}

// Presence-only (not counts): the month grid only needs to know which days
// have an entry visible to this viewer, not how many.
export async function getVisibleEntryDatesForMonth(
  userId: string,
  year: number,
  month: number
): Promise<Set<string>> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // exclusive

  const circles = await getViewerCircles(userId);

  const entries = await prisma.dayEntry.findMany({
    where: {
      date: { gte: start, lt: end },
      OR: visibilityOr(userId, circles),
    },
    select: { date: true },
    distinct: ["date"],
  });

  return new Set(entries.map((e) => e.date.toISOString().slice(0, 10)));
}

// Full rows (author, photos) for Day Detail — unlike the month grid's
// presence-only Set, this needs everything to actually render the day.
export async function getVisibleEntriesForDate(userId: string, dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  const circles = await getViewerCircles(userId);

  return prisma.dayEntry.findMany({
    where: {
      date,
      OR: visibilityOr(userId, circles),
    },
    include: {
      author: { select: { id: true, displayName: true } },
      photos: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}
