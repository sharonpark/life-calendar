import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/components/invites/invite-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CirclesSettingsPage() {
  const session = await auth();
  if (!session?.user?.isOwner) redirect("/calendar");

  const invites = await prisma.invite.findMany({
    where: { invitedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="font-heading text-2xl font-semibold">Invites</h1>

      <Card>
        <CardHeader>
          <CardTitle>Send an invite</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent invites</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invites.length === 0 && (
            <p className="text-sm text-muted-foreground">No invites sent yet.</p>
          )}
          {invites.map((invite) => {
            const status = invite.usedAt
              ? "Accepted"
              : invite.expiresAt < new Date()
                ? "Expired"
                : "Pending";
            const variant =
              status === "Accepted" ? "default" : status === "Expired" ? "destructive" : "secondary";

            return (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{invite.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {invite.circles.join(", ")} · sent {invite.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <Badge variant={variant}>{status}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
