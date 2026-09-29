"use client";

import { ChevronRight, ImageOff, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { listProducts, type AdminProductRow } from "@/services/admin/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load(nextPage: number, append: boolean) {
    setError(null);
    if (!append) setProducts(null);
    else setLoadingMore(true);

    const result = await listProducts(nextPage);

    if (!result.ok) {
      setError(result.error);
      if (!append) setProducts([]);
      setLoadingMore(false);
      return;
    }

    setProducts((current) =>
      append && current
        ? [...current, ...result.data.products]
        : result.data.products,
    );
    setHasMore(result.data.hasMore);
    setPage(result.data.page);
    setLoadingMore(false);
  }

  useEffect(() => {
    void load(1, false);
  }, []);

  // Filtering the loaded page client-side: the admin catalogue is small, and
  // this keeps typing instant instead of firing a request per keystroke.
  const visible = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <>
      <PageTitle
        eyebrow="Manage"
        title="Products"
        action={
          <Button asChild size="lg" className="h-10 text-[11px] tracking-[0.14em] uppercase">
            <Link href="/admin/products/new">
              <Plus data-icon="inline-start" />
              New
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4 lg:mb-6 lg:max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          // pr-11 keeps typed text clear of the clear button.
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

      {visible === null ? (
        <ListSkeleton rows={6} className={listColumns.three} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : "No products yet"}
          hint={
            query
              ? "Try a different word, or clear the search."
              : "Add your first product to get the storefront running."
          }
          action={
            !query && (
              <Button asChild className="h-11 text-[11px] tracking-[0.16em] uppercase">
                <Link href="/admin/products/new">Add product</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className={listColumns.three}>
            {visible.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex h-full items-center gap-3 border border-border bg-card p-2.5 transition-colors hover:bg-muted"
                >
                  {product.image ? (
                    // Plain img: these are admin thumbnails of local files, so
                    // next/image's optimiser adds cost without benefit here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt=""
                      className="size-14 shrink-0 border border-border object-cover"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center border border-dashed border-border text-muted-foreground">
                      <ImageOff className="size-4" aria-hidden />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatPaise(product.price)} · {product.stock} in stock
                    </p>
                    {!product.isActive && (
                      <p className="mt-0.5 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                        Hidden
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && !query && (
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
