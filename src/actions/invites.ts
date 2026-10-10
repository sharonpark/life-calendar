"use server";

import { randomBytes } from "crypto";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Circle } from "@/generated/prisma/client";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvite(email: string, circles: Circle[]) {
  const session = await auth();
  if (!session?.user?.isOwner) throw new Error("Only the owner can send invites");
  if (circles.length === 0) throw new Error("Pick at least one circle");

  const token = randomBytes(32).toString("hex");

  const invite = await prisma.invite.create({
    data: {
      email,
      circles,
      token,
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
  });

  const resend = new Resend(process.env.AUTH_RESEND_KEY);
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;
  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM!,
    to: email,
    subject: "You're invited to Life Calendar",
    html: `<p><a href="${inviteUrl}">Join Life Calendar</a></p><p>This invite expires in 7 days.</p>`,
  });

  return invite;
}

export async function revokeAccess(userId: string) {
  const session = await auth();
  if (!session?.user?.isOwner) throw new Error("Only the owner can revoke access");
  await prisma.user.delete({ where: { id: userId } });
}
