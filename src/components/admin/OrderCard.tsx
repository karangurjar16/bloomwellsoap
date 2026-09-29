import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";
import type { AdminOrderRow } from "@/services/admin/orders";
import { StatusBadge } from "./StatusBadge";

/** Relative age, so the admin can see at a glance what is going stale. */
function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function OrderCard({ order }: { order: AdminOrderRow }) {
  return (
    <Link
      href={`/order/${order.publicId}`}
      className="flex h-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-forest/30 hover:bg-secondary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {order.customerName}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {order.orderNumber} · {order.itemCount}{" "}
          {order.itemCount === 1 ? "item" : "items"} ·{" "}
          {timeAgo(order.createdAt)}
        </p>
      </div>

      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatPaise(order.total)}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
