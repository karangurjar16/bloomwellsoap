"use client";

import { ChevronRight, Package, Plus, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/admin/OrderCard";
import { PageTitle } from "@/components/admin/PageTitle";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  listColumns,
} from "@/components/admin/States";
import { Separator } from "@/components/ui/separator";
import { listOrders, type AdminOrderRow } from "@/services/admin/orders";

const shortcuts = [
  { href: "/admin/products/new", label: "Add product", icon: Plus },
  { href: "/admin/products", label: "All products", icon: Package },
  { href: "/admin/orders", label: "All orders", icon: Receipt },
  { href: "/admin/users", label: "Customers", icon: Users },
] as const;

export default function AdminHomePage() {
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      const result = await listOrders("pending", 1);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setOrders([]);
        return;
      }
      // Only the first few: the full queue has its own page.
      setOrders(result.data.orders.slice(0, 5));
      setPendingCount(result.data.pendingCount);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageTitle eyebrow="Bloomwell" title="Admin" />

      {/* Stacked on a phone; side by side on desktop, the count on the left
          and the shortcuts filling the rest of the row. */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-4">
        {/* The one number that matters: orders waiting on a decision, on the
            panel colour so it reads first. */}
        <Link
          href="/admin/orders"
          className="flex items-center justify-between rounded-lg bg-forest px-4 py-5 text-cream transition-transform hover:-translate-y-0.5 lg:col-span-2 lg:px-6 lg:py-7"
        >
          <span>
            <span className="block text-4xl leading-none font-semibold tracking-tight text-gold tabular-nums lg:text-5xl">
              {orders === null ? "—" : pendingCount}
            </span>
            <span className="mt-2 block text-[10px] tracking-[0.18em] text-cream/70 uppercase">
              Orders awaiting action
            </span>
          </span>
          <ChevronRight className="size-5 text-cream/60" aria-hidden />
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:col-span-3 lg:mt-0 lg:gap-4">
          {shortcuts.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-3.5 text-sm transition-colors hover:border-forest/30 hover:bg-secondary lg:px-5"
            >
              <Icon className="size-4 shrink-0 text-forest" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <Separator className="my-7 lg:my-10" />

      <h2 className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-forest uppercase">
        Pending orders
      </h2>

      {error && <ErrorState message={error} />}

      {orders === null ? (
        <ListSkeleton rows={4} className={listColumns.two} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          hint="New orders will appear here as customers place them."
        />
      ) : (
        <div className={listColumns.two}>
          {orders.map((order) => (
            <OrderCard key={order.publicId} order={order} />
          ))}
        </div>
      )}
    </>
  );
}
