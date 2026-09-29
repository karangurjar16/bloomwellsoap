import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import logo from "@/assets/brand/logo.png";
import logoMark from "@/assets/brand/logo-mark.png";

/**
 * The Bloomwell logo, from the brand artwork: a green "B" with a leaf sprig
 * over the gold BLOOMWELL wordmark.
 *
 * Both PNGs were cut from "bloomwell logo.jpeg" with the white paper turned
 * transparent, so the logo sits on the cream shop and the admin's slate alike
 * without a white box around it. `wordmark={false}` shows the "B" alone, for
 * tight spots like the admin header.
 *
 * This is the project's logo everywhere — header, auth, admin, invoices.
 */

const lockupHeight = {
  sm: "h-11 md:h-14",
  md: "h-16",
  lg: "h-20",
} as const;

const markHeight = {
  sm: "h-9",
  md: "h-11",
  lg: "h-14",
} as const;

type BrandMarkProps = {
  size?: keyof typeof lockupHeight;
  /** Hide the wordmark and show only the "B". */
  wordmark?: boolean;
  /** Wraps the mark in a link when set. */
  href?: string;
  className?: string;
};

export function BrandMark({
  size = "md",
  wordmark = true,
  href,
  className,
}: BrandMarkProps) {
  const image = (
    <Image
      src={wordmark ? logo : logoMark}
      // The link carries its own label; alone, the image is the name.
      alt={href ? "" : "Bloomwell"}
      // In the header on every page, so it should never pop in late.
      loading="eager"
      className={cn(
        "w-auto shrink-0 select-none",
        href && "transition-opacity group-hover:opacity-80",
        wordmark ? lockupHeight[size] : markHeight[size],
      )}
    />
  );

  const layout = cn("flex items-center", className);

  if (!href) return <span className={layout}>{image}</span>;

  return (
    <Link
      href={href}
      aria-label="Bloomwell — go to home"
      className={cn("group focus-visible:outline-none", layout)}
    >
      {image}
    </Link>
  );
}
