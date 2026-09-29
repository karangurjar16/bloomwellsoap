import { Skeleton } from "@/components/ui/skeleton";

/** Matches the product grid's shape, so nothing jumps when data arrives. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-7 md:gap-x-5 md:gap-y-10">
      {Array.from({ length: count }).map((_, i) => (
        // Same blush tile as the real card, so the grid does not restyle
        // itself when data lands.
        <div
          key={i}
          className="w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
        >
          <Skeleton className="aspect-square w-full rounded-2xl bg-blush" />
          <Skeleton className="mt-3.5 h-3.5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-3 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
