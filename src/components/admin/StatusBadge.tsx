import { cn } from "@/lib/utils";

/**
 * Status carries meaning through colour: gold is waiting on you, forest is
 * settled, red was refused. Three states, three unmistakable signals.
 */
const styles: Record<OrderStatus, string> = {
  // Gold reads as "needs you" without being an alarm.
  pending: "border-gold/50 bg-gold-soft text-forest-deep",
  accepted: "border-forest bg-forest text-cream",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
