import { ImageIcon, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { discountPercent, formatPaise } from "@/lib/money";
import type { ShopProduct } from "@/services/shop/catalogue";

/**
 * Shopping card, not an admin row: the photo sits on a blush tile the way a
 * bar sits on a shelf, the name is set in the display serif, and honey is
 * spent only on the price and the discount.
 *
 * No border — the tile is the card. On hover the tile lifts and the photo
 * grows a touch; one effect repeated, rather than a different colour per
 * product, which would turn the grid into confetti.
 */
export function ProductCard({ product }: { product: ShopProduct }) {
  const off = discountPercent(product.price, product.mrp);

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_36px_-18px_rgba(154,100,18,0.45)]">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <span className="grid size-full place-items-center text-gold-deep/30">
              <ImageIcon className="size-7" strokeWidth={1.25} aria-hidden />
            </span>
          )}

          {off > 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 text-[10px] leading-none font-semibold tracking-[0.08em] text-forest-deep uppercase shadow-sm">
              {off}% off
            </span>
          )}

          {!product.inStock && (
            <span className="absolute inset-0 grid place-items-center bg-cream/75 text-[10px] font-semibold tracking-[0.18em] text-forest-deep uppercase backdrop-blur-[1px]">
              Sold out
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-0.5 pt-3.5">
          <h3 className="truncate font-display text-[13px] leading-snug font-bold tracking-[0.04em] text-forest-deep uppercase md:text-sm">
            {product.name}
          </h3>
          {product.tagline && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {product.tagline}
            </p>
          )}

          {/* mt-auto pins the price to the bottom, so a two-line name and a
              one-line name still align across the grid. */}
          <div className="mt-auto flex items-center gap-1.5 pt-2.5">
            <span className="text-[15px] leading-none font-semibold tracking-tight text-gold-deep tabular-nums">
              {formatPaise(product.price)}
            </span>
            {off > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPaise(product.mrp)}
              </span>
            )}
            {/* Decorative: the whole card is the link. */}
            <span
              aria-hidden
              className="ml-auto grid size-8 place-items-center rounded-full bg-blush text-gold-deep transition-colors group-hover:bg-forest group-hover:text-cream"
            >
              <ShoppingBag className="size-3.5" strokeWidth={1.75} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
