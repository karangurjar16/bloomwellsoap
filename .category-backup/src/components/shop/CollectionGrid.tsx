import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ShopCategory } from "@/services/shop/catalogue";

/**
 * Categories as a horizontally scrolling row of picture cards.
 *
 * A wrapping grid pushed the page longer with every category added, so the
 * products fell further down the screen. A rail keeps the block one row tall
 * however many categories exist, and the tile cut off at the right edge is what
 * tells a thumb there is more to swipe.
 *
 * Every tile is the same shape and the name sits below the image, not over it:
 * text on a photo needed a dark scrim that went muddy over pale pictures, and
 * out here the label reads the same whether a category has a logo or an emoji.
 */
export function CollectionGrid({
  categories,
}: {
  categories: ShopCategory[];
}) {
  return (
    // Negative margin plus matching padding lets the row bleed to the screen
    // edge while staying aligned with the rest of the page. Safe centering
    // centres a short row but falls back to start once it overflows, so the
    // first tile is never pushed out of reach. On desktop the tiles wrap six
    // to a row (width = a sixth of the row minus five gaps) and centre too.
    <ul className="-mx-5 flex justify-center-safe snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:gap-5 md:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((category) => (
        <li
          key={category.id}
          className="w-[38%] shrink-0 snap-start sm:w-36 md:w-44 lg:w-[calc((100%-6.25rem)/6)]"
        >
          <Link
            href={`/products?category=${category.slug}`}
            className="group flex h-full flex-col"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_36px_-18px_rgba(154,100,18,0.45)]">
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span
                  className="grid size-full place-items-center text-3xl"
                  aria-hidden
                >
                  {category.emoji ?? "◦"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-0.5 pt-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[13px] leading-none font-bold tracking-[0.04em] text-forest-deep uppercase md:text-sm">
                  {category.name}
                </h3>
                <p className="mt-1.5 truncate text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "item" : "items"}
                </p>
              </div>

              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blush text-gold-deep transition-colors duration-300 group-hover:bg-gold group-hover:text-forest-deep">
                <ArrowUpRight className="size-3" aria-hidden />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
