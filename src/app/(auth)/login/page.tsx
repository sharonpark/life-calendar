import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="font-heading text-2xl font-semibold">Life Calendar</h1>
      <form
        action={async (formData) => {
          "use server";
          const email = formData.get("email") as string;
          await signIn("resend", { email, redirectTo: "/calendar" });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <Button type="submit">Send magic link</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        This app is invite-only. If you haven&apos;t been invited yet, this won&apos;t send anything.
      </p>
    </div>
  );
}
