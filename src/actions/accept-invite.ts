"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

export async function acceptInvite(token: string, displayName: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) throw new Error("Invite not found");
  if (invite.usedAt) throw new Error("Invite already used");
  if (invite.expiresAt < new Date()) throw new Error("Invite expired");

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        displayName,
        emailVerified: new Date(), // clicking the invite link is the verification
        memberships: {
        create: invite.circles.map((circle: (typeof invite.circles)[number]) => ({ circle })),
      },
      },
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  // Kicks off the same magic-link flow as a returning sign-in, since the
  // user now exists and sendVerificationRequest's invite-only gate passes.
  await signIn("resend", { email: invite.email, redirectTo: "/calendar" });
}
