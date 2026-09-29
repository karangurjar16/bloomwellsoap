"use client";

import { ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listMyOrders, type MyOrder } from "@/services/shop/orders";

/** Customer-facing wording: "rejected" is too blunt for the person who ordered. */
const statusLabel: Record<OrderStatus, string> = {
  pending: "Awaiting confirmation",
  accepted: "Confirmed",
  rejected: "Could not be fulfilled",
};

const statusStyle: Record<OrderStatus, string> = {
  pending: "bg-gold-soft text-forest-deep",
  accepted: "bg-forest text-cream",
  rejected: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await listMyOrders();
      if (!result.ok) {
        if (/sign(ed)? in/i.test(result.error)) setNeedsLogin(true);
        else toast.error(result.error);
        setOrders([]);
        return;
      }
      setOrders(result.data);
    }
    void load();
  }, []);

  if (orders === null) {
    return (
      <div className="space-y-3 pt-8">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="pt-16 text-center">
        <Package className="mx-auto size-8 text-forest" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-2xl leading-none">Your orders</h1>
        <p className="mx-auto mt-2.5 max-w-xs text-sm text-muted-foreground">
          Sign in to see what you have ordered.
        </p>
        <Button
          asChild
          className="rounded-full mt-6 h-12 bg-forest px-8 text-[11px] font-semibold tracking-[0.16em] text-cream uppercase hover:bg-forest-deep"
        >
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="pt-16 text-center">
        <Package className="mx-auto size-8 text-forest" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-2xl leading-none">No orders yet</h1>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Anything you order will show up here.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-6 h-12 px-8 text-[11px] tracking-[0.16em] uppercase"
        >
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="pt-8 pb-5">
        <h1 className="font-display text-3xl leading-none">Your orders</h1>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </header>

      <ul className="space-y-2.5">
        {orders.map((order) => (
          <li key={order.publicId}>
            <Link
              href={`/order/${order.publicId}`}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-3.5 transition-colors hover:border-forest/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] uppercase",
                      statusStyle[order.status],
                    )}
                  >
                    {statusLabel[order.status]}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-medium">
                  {order.firstItem}
                  {order.itemCount > 1 && (
                    <span className="text-muted-foreground">
                      {" "}
                      and {order.itemCount - 1} more
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.orderNumber} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>

              <span className="shrink-0 text-base leading-none font-semibold tracking-tight text-forest-deep tabular-nums">
                {formatPaise(order.total)}
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
