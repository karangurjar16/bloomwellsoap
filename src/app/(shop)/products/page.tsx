import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/shop/ProductGridSkeleton";
import { ProductsBrowser } from "@/components/shop/ProductsBrowser";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Server shell. The browser below reads useSearchParams(), which needs a
 * Suspense boundary above it — without one the build fails trying to
 * prerender this page, since search params are only known per request.
 */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <>
          <div className="pt-8 pb-5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
          <Skeleton className="mb-4 h-12 w-full" />
          <div className="mb-6 flex gap-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
          <ProductGridSkeleton />
        </>
      }
    >
      <ProductsBrowser />
    </Suspense>
  );
}
