"use client";

import { useCallback, useEffect, useState } from "react";
import { OrderCard } from "@/components/admin/OrderCard";
import { PageTitle } from "@/components/admin/PageTitle";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  listColumns,
  loadMoreClass,
} from "@/components/admin/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listOrders,
  type AdminOrderRow,
  type OrderFilter,
} from "@/services/admin/orders";

const filters: { value: OrderFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderFilter>("pending");
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (nextFilter: OrderFilter, nextPage: number, append: boolean) => {
      setError(null);
      if (!append) setOrders(null);
      else setLoadingMore(true);

      const result = await listOrders(nextFilter, nextPage);

      if (!result.ok) {
        setError(result.error);
        if (!append) setOrders([]);
        setLoadingMore(false);
        return;
      }

      setOrders((current) =>
        append && current ? [...current, ...result.data.orders] : result.data.orders,
      );
      setHasMore(result.data.hasMore);
      setPage(result.data.page);
      setLoadingMore(false);
    },
    [],
  );

  useEffect(() => {
    void load(filter, 1, false);
  }, [filter, load]);

  return (
    <>
      <PageTitle eyebrow="Manage" title="Orders" />

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as OrderFilter)}
        className="mb-5 lg:mb-6"
      >
        {/* Scrolls sideways rather than wrapping, so the row stays one line.
            On desktop it only needs to be as wide as its tabs. */}
        <TabsList className="w-full justify-start overflow-x-auto lg:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="text-[11px] tracking-[0.1em] uppercase"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <div className="mb-4">
          <ErrorState
            message={error}
            onRetry={() => void load(filter, 1, false)}
          />
        </div>
      )}

      {orders === null ? (
        <ListSkeleton className={listColumns.two} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders here"
          hint={
            filter === "pending"
              ? "Accepted and rejected orders are under the other tabs."
              : "Nothing with this status yet."
          }
        />
      ) : (
        <>
          <div className={listColumns.two}>
            {orders.map((order) => (
              <OrderCard key={order.publicId} order={order} />
            ))}
          </div>

          {hasMore && (
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void load(filter, page + 1, true)}
              className={`mt-4 h-11 w-full text-[11px] tracking-[0.16em] uppercase lg:mt-6 ${loadMoreClass}`}
            >
              {loadingMore ? "Loading" : "Load more"}
            </Button>
          )}
        </>
      )}
    </>
  );
}
