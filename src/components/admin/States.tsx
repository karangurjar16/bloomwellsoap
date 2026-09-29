import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * List layouts: a single stack on a phone, columns on desktop. Shared so a
 * list and its skeleton always agree.
 */
export const listColumns = {
  two: "space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0",
  three: "space-y-2.5 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0",
} as const;

/** Keeps "Load more" a sensible size once the page is wide. */
export const loadMoreClass = "lg:mx-auto lg:flex lg:w-72";

/**
 * Shown while a list loads — same row height as the real cards, so nothing
 * jumps. Pass the list's own layout classes so desktop columns match too.
 */
export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-border px-6 py-14 text-center">
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-l-2 border-destructive bg-destructive/5 px-4 py-3">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1.5 text-xs text-destructive underline underline-offset-4"
        >
          Try again
        </button>
      )}
    </div>
  );
}
