"use server";

import { revalidatePath } from "next/cache";
import { createInvite } from "@/actions/invites";
import type { Circle } from "@/generated/prisma/client";

export type SendInviteFormState =
  | { ok: true; email: string }
  | { ok: false; error: string }
  | null;

export async function sendInvite(
  _prevState: SendInviteFormState,
  formData: FormData
): Promise<SendInviteFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const circles = formData.getAll("circles") as Circle[];

  try {
    if (!email) throw new Error("Enter an email address");
    await createInvite(email, circles);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }

  revalidatePath("/settings/circles");
  return { ok: true, email };
}
