"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { setCartItem } from "@/services/shop/cart";
import { useCartCount } from "./CartCount";

/**
 * Sticky action bar on the product page. Price stays visible while the page
 * scrolls, so the decision and the button are never separated.
 */
export function AddToCartBar({
  productId,
  slug,
  price,
  inStock,
}: {
  productId: string;
  slug: string;
  price: number;
  inStock: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const { bump, refresh } = useCartCount();

  async function add() {
    setBusy(true);
    // Badge moves on tap rather than after the round trip; corrected below if
    // the request turns out to have failed.
    bump(1);

    const result = await setCartItem(productId, 1);

    if (!result.ok) {
      bump(-1);
      setBusy(false);

      // The cart lives on the server, so adding needs a session. Send them to
      // sign in and back to this product afterwards.
      if (/sign(ed)? in/i.test(result.error)) {
        router.push(`/login?next=/products/${slug}`);
        return;
      }
      toast.error(result.error);
      return;
    }

    await refresh();
    setBusy(false);
    setAdded(true);
    toast.success("Added to your bag");
  }

  return (
    // Fixed, not sticky: sticky kept the bar in the document flow, so on a
    // short page it just sat there mid-scroll with dead space beneath it.
    // Fixed pins it to the viewport and the product scrolls behind.
    // data-cart-bar lets the footer pad itself clear of this bar.
    <div
      data-cart-bar
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:max-w-7xl md:px-8">
        <div className="shrink-0">
          <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Price
          </p>
          <p className="text-lg leading-none font-semibold tracking-tight text-forest-deep tabular-nums">
            {formatPaise(price)}
          </p>
        </div>

        {added ? (
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="ml-auto flex h-12 flex-1 items-center md:w-80 md:flex-none justify-center gap-2 rounded-full bg-gold text-[11px] font-semibold tracking-[0.16em] text-forest-deep uppercase transition-transform hover:-translate-y-0.5"
          >
            <Check className="size-4" aria-hidden />
            View bag
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void add()}
            disabled={busy || !inStock}
            className="ml-auto flex h-12 flex-1 items-center md:w-80 md:flex-none justify-center gap-2 rounded-full bg-forest text-[11px] font-semibold tracking-[0.16em] text-cream uppercase transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
          >
            <ShoppingBag className="size-4" aria-hidden />
            {!inStock ? "Sold out" : busy ? "Adding" : "Add to bag"}
          </button>
        )}
      </div>
    </div>
  );
}

