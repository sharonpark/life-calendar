"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { sendInvite, type SendInviteFormState } from "@/actions/send-invite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: SendInviteFormState = null;

export function InviteForm() {
  const [state, formAction, isPending] = useActionState(sendInvite, initialState);
  // Base UI's Checkbox keeps its own internal visual state and doesn't listen
  // for the native <form> "reset" event, so form.reset() alone leaves it
  // showing checked even though the underlying input resets. Remounting the
  // form via `key` guarantees every field (including the checkboxes) starts fresh.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state === null) return;
    if (state.ok) {
      toast.success(`Invite sent to ${state.email}`);
      setFormKey((key) => key + 1);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="them@example.com" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Circles</Label>
        <div className="flex items-center gap-2">
          <Checkbox id="circle-family" name="circles" value="FAMILY" />
          <Label htmlFor="circle-family" className="font-normal">
            Family
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="circle-friends" name="circles" value="FRIENDS" />
          <Label htmlFor="circle-friends" className="font-normal">
            Friends
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
