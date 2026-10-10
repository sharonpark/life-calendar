"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/r2";
import type { Circle } from "@/generated/prisma/client";

const MAX_PHOTOS_PER_BATCH = 10;

function revalidateDay(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  revalidatePath("/calendar");
  revalidatePath(`/calendar/${year}/${month}`);
  revalidatePath(`/calendar/${year}/${month}/day/${day}`);
}

export async function createDayEntry(input: {
  date: string; // "YYYY-MM-DD"
  note: string | null;
  circles: Circle[];
}): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (input.circles.length === 0) throw new Error("Pick at least one circle");

  const date = new Date(`${input.date}T00:00:00.000Z`);
  const todayIso = new Date().toISOString().slice(0, 10);
  if (input.date > todayIso) throw new Error("Future dates cannot have photos added");

  const entry = await prisma.dayEntry.create({
    data: {
      authorId: session.user.id,
      date,
      note: input.note,
      visibleToFamily: input.circles.includes("FAMILY"),
      visibleToFriends: input.circles.includes("FRIENDS"),
    },
  });

  revalidateDay(input.date);
  return { id: entry.id };
}

async function assertOwnsDayEntry(dayEntryId: string, userId: string) {
  const entry = await prisma.dayEntry.findUnique({ where: { id: dayEntryId } });
  if (!entry || entry.authorId !== userId) throw new Error("Entry not found");
  return entry;
}

export async function requestUploadUrls(
  dayEntryId: string,
  files: { contentType: string }[]
): Promise<{ key: string; uploadUrl: string }[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (files.length === 0) return [];
  if (files.length > MAX_PHOTOS_PER_BATCH) throw new Error(`Max ${MAX_PHOTOS_PER_BATCH} photos per upload`);

  await assertOwnsDayEntry(dayEntryId, session.user.id);

  return Promise.all(
    files.map(async (file) => {
      const ext = file.contentType.split("/")[1] ?? "jpg";
      const key = `${session.user.id}/${dayEntryId}/${randomUUID()}-original.${ext}`;
      const uploadUrl = await getPresignedUploadUrl(key, file.contentType);
      return { key, uploadUrl };
    })
  );
}

export async function addPhotos(
  dayEntryId: string,
  photos: { key: string; order: number }[]
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const entry = await assertOwnsDayEntry(dayEntryId, session.user.id);

  await prisma.photo.createMany({
    data: photos.map((p) => ({
      dayEntryId,
      storageUrl: p.key,
      thumbnailUrl: p.key,
      order: p.order,
    })),
  });

  revalidateDay(entry.date.toISOString().slice(0, 10));
}
