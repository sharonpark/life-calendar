import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/actions/accept-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-2 px-4 text-center">
        <h1 className="font-heading text-xl font-semibold">This invite isn&apos;t valid</h1>
        <p className="text-sm text-muted-foreground">
          It may have expired or already been used. Ask the owner to send a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="font-heading text-2xl font-semibold">Welcome to Life Calendar</h1>
      <p className="text-sm text-muted-foreground">
        You&apos;re joining as {invite.email}, in {invite.circles.join(" & ").toLowerCase()}.
      </p>
      <form
        action={async (formData) => {
          "use server";
          const displayName = formData.get("displayName") as string;
          await acceptInvite(token, displayName);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Your name</Label>
          <Input id="displayName" name="displayName" required placeholder="How family should see you" />
        </div>
        <Button type="submit">Join</Button>
      </form>
    </div>
  );
}
