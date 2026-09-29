"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptOrder, rejectOrder } from "@/services/admin/orders";

/**
 * Rendered only for an admin looking at a pending order. The routes re-check
 * both the role and the status, so this is presentation, not authorisation.
 */
export function OrderActions({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);

  async function run(action: "accept" | "reject") {
    setBusy(action);
    const result =
      action === "accept"
        ? await acceptOrder(publicId)
        : await rejectOrder(publicId);

    if (!result.ok) {
      toast.error(result.error);
      setBusy(null);
      // The order may have been handled elsewhere, so pull the real status in.
      router.refresh();
      return;
    }

    toast.success(action === "accept" ? "Order accepted" : "Order rejected");
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        disabled={busy !== null}
        onClick={() => void run("accept")}
        className="h-12 w-full text-[11px] tracking-[0.18em] uppercase"
      >
        <Check data-icon="inline-start" />
        {busy === "accept" ? "Accepting" : "Accept order"}
      </Button>

      <Button
        type="button"
        variant="destructive"
        disabled={busy !== null}
        onClick={() => void run("reject")}
        className="h-11 w-full text-[11px] tracking-[0.16em] uppercase"
      >
        <X data-icon="inline-start" />
        {busy === "reject" ? "Rejecting" : "Reject"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Accepting reduces stock for each item.
      </p>
    </div>
  );
}
