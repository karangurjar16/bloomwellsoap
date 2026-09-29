"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProducts, type ShopProduct } from "@/services/shop/catalogue";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

const PAGE_SIZE = 12;

/**
 * Client half of /products: search, the product grid and "Load more".
 */
export function ProductsBrowser() {
  const [products, setProducts] = useState<ShopProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Waits for a pause in typing instead of firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setError(null);
      if (!append) setProducts(null);
      else setLoadingMore(true);

      const result = await listProducts({
        q: debounced || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

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
      <header className="pt-8 pb-5">
        <h1 className="font-display text-3xl leading-none">Everything</h1>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {products === null
            ? "Loading"
            : `${total} ${total === 1 ? "item" : "items"}`}
        </p>
      </header>

      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
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
        <div className="mb-4 border-l-2 border-destructive bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void load(1, false)}
            className="mt-1.5 text-xs text-destructive underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {products === null ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg">Nothing here yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {debounced
              ? `Nothing matches “${debounced}”.`
              : "The shop is being filled in."}
          </p>
          {debounced && (
            <Button
              variant="outline"
              onClick={() => setQuery("")}
              className="rounded-full mt-5 h-11 text-[11px] tracking-[0.16em] uppercase"
            >
              Show everything
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Wrapping flex rather than a grid so a short last row sits in the
              middle. Each width is 1/n of the row minus the gaps between. */}
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-7 md:gap-x-5 md:gap-y-10">
            {products.map((product) => (
              <li
                key={product.id}
                className="w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
              >
                <ProductCard product={product} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <Button
              variant="outline"
              disabled={loadingMore}
              onClick={() => void load(page + 1, true)}
              className="rounded-full mt-8 h-12 w-full text-[11px] tracking-[0.16em] uppercase md:mx-auto md:flex md:w-72"
            >
              {loadingMore ? "Loading" : "Load more"}
            </Button>
          )}
        </>
      )}
    </>
  );
}
