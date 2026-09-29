"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCartCount } from "@/components/shop/CartCount";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPaise } from "@/lib/money";
import { getCart, setCartItem, type CartView } from "@/services/shop/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { refresh } = useCartCount();

  async function load() {
    const result = await getCart();
    if (!result.ok) {
      // 401 is the signed-out case, not a failure worth shouting about.
      if (/sign(ed)? in/i.test(result.error)) {
        setNeedsLogin(true);
        setCart({ items: [], subtotal: 0, savings: 0, deliveryFee: 0, total: 0 });
        return;
      }
      toast.error(result.error);
      setCart({ items: [], subtotal: 0, savings: 0, deliveryFee: 0, total: 0 });
      return;
    }
    setCart(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeQty(productId: string, qty: number) {
    setPendingId(productId);
    const result = await setCartItem(productId, qty);
    setPendingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCart(result.data);
    await refresh();
  }

  if (cart === null) {
    return (
      <div className="space-y-3 pt-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="pt-16 text-center">
        <ShoppingBag
          className="mx-auto size-8 text-forest"
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="mt-4 font-display text-2xl leading-none">Your bag</h1>
        <p className="mx-auto mt-2.5 max-w-xs text-sm text-muted-foreground">
          Sign in to see what you have saved and to place an order.
        </p>
        <Button
          asChild
          className="mt-6 h-12 px-8 text-[11px] tracking-[0.18em] uppercase"
        >
          <Link href="/login?next=/cart">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="pt-16 text-center">
        <ShoppingBag
          className="mx-auto size-8 text-forest"
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="mt-4 font-display text-2xl leading-none">
          Your bag is empty
        </h1>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Nothing saved yet — have a look at what is in.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-6 h-12 px-8 text-[11px] tracking-[0.16em] uppercase"
        >
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  const freeDeliveryGap = 99900 - cart.subtotal;

  return (
    <>
      <header className="pt-8 pb-5">
        <h1 className="font-display text-3xl leading-none">Your bag</h1>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
        </p>
      </header>

      <ul className="space-y-3">
        {cart.items.map((line) => (
          <li key={line.productId} className="flex gap-3 rounded-lg border border-border/70 bg-card p-2.5">
            <Link href={`/products/${line.slug}`} className="shrink-0">
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.image}
                  alt=""
                  className="aspect-[4/5] w-20 rounded-md bg-forest-soft object-cover"
                />
              ) : (
                <span className="block aspect-[4/5] w-20 bg-muted" />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/products/${line.slug}`} className="min-w-0">
                <p className="truncate text-sm">{line.name}</p>
                {line.unit && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {line.unit}
                  </p>
                )}
              </Link>

              <p className="mt-1 text-sm leading-none font-semibold tabular-nums">
                {formatPaise(line.lineTotal)}
              </p>

              <div className="mt-auto flex items-center gap-1 pt-2">
                {/* Stepper: 40px targets, the smallest that stays comfortable. */}
                <button
                  type="button"
                  onClick={() => void changeQty(line.productId, line.qty - 1)}
                  disabled={pendingId === line.productId}
                  aria-label={`Reduce ${line.name}`}
                  className="grid size-9 place-items-center border border-border transition-colors hover:border-foreground/40 disabled:opacity-40"
                >
                  {line.qty === 1 ? (
                    <Trash2 className="size-3.5" aria-hidden />
                  ) : (
                    <Minus className="size-3.5" aria-hidden />
                  )}
                </button>

                <span className="w-9 text-center text-sm tabular-nums">
                  {line.qty}
                </span>

                <button
                  type="button"
                  onClick={() => void changeQty(line.productId, line.qty + 1)}
                  disabled={
                    pendingId === line.productId || line.qty >= line.stock
                  }
                  aria-label={`Add another ${line.name}`}
                  className="grid size-9 place-items-center border border-border transition-colors hover:border-foreground/40 disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>

                {line.qty >= line.stock && (
                  <span className="ml-1 text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                    Max
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {freeDeliveryGap > 0 && (
        <p className="mt-5 rounded-lg bg-gold-soft px-4 py-3 text-center text-xs font-medium text-forest-deep">
          Add {formatPaise(freeDeliveryGap)} more for free delivery
        </p>
      )}

      <Separator className="my-6" />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPaise(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>Delivery</dt>
          <dd className="tabular-nums">
            {cart.deliveryFee === 0 ? (
              <span className="font-semibold text-forest">Free</span>
            ) : (
              formatPaise(cart.deliveryFee)
            )}
          </dd>
        </div>
        {cart.savings > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <dt>You save</dt>
            <dd className="tabular-nums">−{formatPaise(cart.savings)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-2.5">
          <dt className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Total
          </dt>
          <dd className="text-2xl leading-none font-semibold tracking-tight text-forest-deep tabular-nums">
            {formatPaise(cart.total)}
          </dd>
        </div>
      </dl>

      <Button
        asChild
        className="rounded-full mt-6 h-12 w-full bg-forest text-[11px] font-semibold tracking-[0.18em] text-cream uppercase hover:bg-forest-deep"
      >
        <Link href="/checkout">
          Checkout
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
      <p className="mt-2.5 mb-4 text-center text-xs text-muted-foreground">
        Cash on delivery · confirmed on WhatsApp
      </p>
    </>
  );
}
