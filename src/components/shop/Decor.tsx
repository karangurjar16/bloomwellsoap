import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The storefront's small shared vocabulary: the pill button with its round
 * arrow, the two-tone section title, the sparkle and the turning badge. Kept
 * in one file so every page draws them the same way.
 */

/**
 * Pill link with a cream disc holding the arrow at its end. The disc nudges
 * up and right on hover, the one bit of motion a call to action needs.
 */
export function PillLink({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: React.ReactNode;
  /** "solid" is green on light ground; "outline" is the quieter second choice. */
  variant?: "solid" | "outline";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center gap-3 rounded-full pr-1.5 pl-6 text-[11px] font-semibold tracking-[0.16em] uppercase transition-all hover:-translate-y-0.5",
        variant === "solid"
          ? "bg-forest text-cream shadow-[0_10px_24px_-12px_rgba(28,46,27,0.6)] hover:bg-forest-deep"
          : "border border-forest/25 text-forest-deep hover:border-forest hover:bg-forest-soft",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full",
          variant === "solid" ? "bg-cream text-gold-deep" : "bg-forest text-cream",
        )}
      >
        <ArrowUpRight
          className="size-4 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
          aria-hidden
        />
      </span>
    </Link>
  );
}

/**
 * Uppercase serif title with one word in honey — the accent is a word, not a
 * colour splashed around, so it reads as emphasis.
 */
export function SectionTitle({
  lead,
  accent,
  tail,
  as: Tag = "h2",
  className,
}: {
  lead?: string;
  accent: string;
  tail?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "font-display text-[1.7rem] leading-[1.1] font-bold text-forest-deep uppercase md:text-4xl",
        className,
      )}
    >
      {lead && <>{lead} </>}
      <span className="text-gold">{accent}</span>
      {tail && <> {tail}</>}
    </Tag>
  );
}

/** Four-point sparkle, drawn in currentColor. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)}>
      <path
        fill="currentColor"
        d="M12 0c.9 6.6 4.8 10.9 12 12-7.2 1.1-11.1 5.4-12 12-.9-6.6-4.8-10.9-12-12C7.2 10.9 11.1 6.6 12 0Z"
      />
    </svg>
  );
}

/**
 * Text set around a circle, turning slowly, with a sparkle at its heart. The
 * text path is a circle drawn as two arcs, since SVG text needs a path to
 * follow; textLength spreads the letters to exactly one lap (2πr ≈ 238), so
 * the phrase meets its own start whatever its length. Holds still for anyone
 * who has asked for reduced motion. Its path id is fixed, so use one per page.
 */
export function RotatingBadge({
  text = "Bloomwell · Gentle soap & shampoo · ",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative grid size-28 place-items-center rounded-full bg-cream shadow-[0_12px_30px_-14px_rgba(28,46,27,0.35)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full animate-spin-slow motion-reduce:animate-none"
      >
        <defs>
          <path
            id="badge-circle"
            d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"
          />
        </defs>
        <text className="fill-forest-deep font-display text-[8.5px] font-semibold uppercase">
          <textPath
            href="#badge-circle"
            textLength="236"
            lengthAdjust="spacing"
          >
            {text}
          </textPath>
        </text>
      </svg>
      <Sparkle className="size-7 text-gold" />
    </div>
  );
}
