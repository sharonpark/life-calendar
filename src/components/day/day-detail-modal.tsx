"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function DayDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(next: boolean) {
    // Flip state immediately so the dialog actually closes, rather than
    // waiting on router.back() (which can lag or, if there's no history
    // entry to return to, never resolve at all).
    setOpen(next);
    if (!next) router.back();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">{children}</DialogContent>
    </Dialog>
  );
}
