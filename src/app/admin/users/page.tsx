"use client";

import { ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageTitle } from "@/components/admin/PageTitle";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  listColumns,
  loadMoreClass,
} from "@/components/admin/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { listUsers, type AdminUserRow } from "@/services/admin/users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Searching by name or mobile hits the server, so it waits for a pause in
  // typing rather than firing per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setError(null);
      if (!append) setUsers(null);
      else setLoadingMore(true);

      const result = await listUsers({
        q: debounced || undefined,
        page: nextPage,
      });

      if (!result.ok) {
        setError(result.error);
        if (!append) setUsers([]);
        setLoadingMore(false);
        return;
      }

      setUsers((current) =>
        append && current ? [...current, ...result.data.users] : result.data.users,
      );
      setTotal(result.data.total);
      setHasMore(result.data.hasMore);
      setPage(result.data.page);
      setLoadingMore(false);
    },
    [debounced],
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  return (
    <>
      <PageTitle eyebrow="Manage" title="Customers" />

      <div className="relative mb-4 lg:mb-6 lg:max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or mobile"
          aria-label="Search customers"
          className="h-12 pl-10 text-base [&:not(:placeholder-shown)]:pr-11"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={() => void load(1, false)} />
        </div>
      )}

      {users !== null && users.length > 0 && (
        <p className="mb-3 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {total} {total === 1 ? "customer" : "customers"}
        </p>
      )}

      {users === null ? (
        <ListSkeleton rows={6} className={listColumns.three} />
      ) : users.length === 0 ? (
        <EmptyState
          title={debounced ? "No matches" : "No customers yet"}
          hint={
            debounced
              ? "Try a different name or number."
              : "Customers appear here once they register."
          }
        />
      ) : (
        <>
          <ul className={listColumns.three}>
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex h-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-forest/30 hover:bg-secondary"
                >
                  {/* Initial instead of an avatar: there are no profile
                      pictures, and a letter beats an empty circle. */}
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-base text-forest-deep">
                    {user.name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {user.name}
                      {user.role === "admin" && (
                        <span className="border border-foreground px-1.5 py-0.5 text-[9px] font-medium tracking-[0.1em] uppercase">
                          Admin
                        </span>
                      )}
                      {!user.isActive && (
                        <span className="text-[9px] tracking-[0.1em] text-destructive uppercase">
                          Disabled
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {user.mobile} ·{" "}
                      {user.orderCount === 0
                        ? "no orders"
                        : `${user.orderCount} ${user.orderCount === 1 ? "order" : "orders"}`}
                    </p>
                  </div>

                  {user.acceptedTotal > 0 && (
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatPaise(user.acceptedTotal)}
                    </span>
                  )}
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void load(page + 1, true)}
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
