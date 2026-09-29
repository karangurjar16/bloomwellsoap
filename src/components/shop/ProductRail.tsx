import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ShopProduct } from "@/services/shop/catalogue";
import { ProductCard } from "./ProductCard";

/**
 * A horizontally scrolling row with snap points — the pattern a phone shopper
 * already knows from every app on their home screen. Deliberately not a grid:
 * a rail says "a few picks", a grid says "here is the catalogue".
 */
export function ProductRail({
  title,
  products,
  href,
  linkLabel = "See all",
}: {
  /** A string becomes a plain heading; pass a node for a styled one. */
  title: React.ReactNode;
  products: ShopProduct[];
  href?: string;
  linkLabel?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3 md:mb-7">
        {typeof title === "string" ? (
          <h2 className="font-display text-2xl leading-none md:text-3xl">
            {title}
          </h2>
        ) : (
          title
        )}
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-1 pb-1 text-[10px] font-semibold tracking-[0.14em] text-forest uppercase transition-colors hover:text-gold-deep"
          >
            {linkLabel}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>

      {/* Negative margin + matching padding lets the row bleed to the screen
          edge, so the last card is visibly cut off and invites a swipe. A row
          short enough to fit is centred; desktop wraps four to a row. */}
      <ul className="-mx-5 flex justify-center-safe snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:gap-5 md:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <li key={product.id} className="w-[46%] shrink-0 snap-start sm:w-44 md:w-56 lg:w-[calc((100%-3.75rem)/4)]">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
