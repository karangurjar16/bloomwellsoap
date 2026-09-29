"use client";

import { Check, MapPin, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressForm } from "@/components/shop/AddressForm";
import { useCartCount } from "@/components/shop/CartCount";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listAddresses, type Address } from "@/services/shop/addresses";
import { getCart, type CartView } from "@/services/shop/cart";
import { placeOrder } from "@/services/shop/orders";

export default function CheckoutPage() {
  const router = useRouter();
  const { refresh: refreshCount } = useCartCount();

  const [cart, setCart] = useState<CartView | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  async function loadAddresses(selectNewest = false) {
    const result = await listAddresses();
    if (!result.ok) {
      if (/sign(ed)? in/i.test(result.error)) setNeedsLogin(true);
      setAddresses([]);
      return;
    }

    setAddresses(result.data);
    setSelectedId((current) => {
      if (selectNewest) {
        // After adding, select the one just created — it is what the customer
        // came here to do.
        return result.data[result.data.length - 1]?.id ?? current;
      }
      if (current) return current;
      // Otherwise pre-select the default, so a returning customer can place an
      // order in one tap.
      return (
        result.data.find((a) => a.isDefault)?.id ?? result.data[0]?.id ?? null
      );
    });
  }

  useEffect(() => {
    async function load() {
      const result = await getCart();
      if (!result.ok) {
        if (/sign(ed)? in/i.test(result.error)) setNeedsLogin(true);
        setCart({ items: [], subtotal: 0, savings: 0, deliveryFee: 0, total: 0 });
      } else {
        setCart(result.data);
      }
      await loadAddresses();
    }
    void load();
  }, []);

  async function submit() {
    if (!selectedId) {
      toast.error("Choose a delivery address first");
      return;
    }

    setPlacing(true);
    const result = await placeOrder(selectedId);

    if (!result.ok) {
      toast.error(result.error);
      setPlacing(false);
      return;
    }

    // The order is already saved at this point, so nothing below can lose it.
    await refreshCount();

    if (result.data.waUrl) {
      // Hand off to WhatsApp with the message prefilled. The customer still has
      // to press send; if they don't, the order is in the admin panel anyway.
      window.location.href = result.data.waUrl;
      return;
    }

    // No admin number configured — go straight to the order page.
    router.replace(`/order/${result.data.publicId}`);
  }

  if (cart === null || addresses === null) {
    return (
      <div className="space-y-3 pt-8">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="pt-16 text-center">
        <ShoppingBag className="mx-auto size-8 text-forest" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-2xl leading-none">Checkout</h1>
        <p className="mx-auto mt-2.5 max-w-xs text-sm text-muted-foreground">
          Sign in to place your order.
        </p>
        <Button
          asChild
          className="rounded-full mt-6 h-12 bg-forest px-8 text-[11px] font-semibold tracking-[0.16em] text-cream uppercase hover:bg-forest-deep"
        >
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="pt-16 text-center">
        <ShoppingBag className="mx-auto size-8 text-forest" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-2xl leading-none">
          Nothing to check out
        </h1>
        <p className="mt-2.5 text-sm text-muted-foreground">
          Your bag is empty.
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

  return (
    <>
      <header className="pt-8 pb-5">
        <h1 className="font-display text-3xl leading-none">Checkout</h1>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          Cash on delivery
        </p>
      </header>

      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-forest uppercase">
        <MapPin className="size-3.5" aria-hidden />
        Deliver to
      </h2>

      {addresses.length === 0 && !adding && (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium">No address saved yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            An address is needed before an order can be placed.
          </p>
          <Button
            onClick={() => setAdding(true)}
            className="rounded-full mt-4 h-11 bg-forest text-[11px] font-semibold tracking-[0.14em] text-cream uppercase hover:bg-forest-deep"
          >
            <Plus data-icon="inline-start" />
            Add address
          </Button>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="space-y-2.5">
          {addresses.map((address) => {
            const selected = address.id === selectedId;
            return (
              <li key={address.id}>
                {/* The whole card is the control, so a thumb doesn't have to
                    find a small radio dot. */}
                <button
                  type="button"
                  onClick={() => setSelectedId(address.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full gap-3 rounded-lg border p-3.5 text-left transition-colors",
                    selected
                      ? "border-forest bg-forest-soft/60"
                      : "border-border/70 bg-card hover:border-forest/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                      selected
                        ? "border-forest bg-forest text-cream"
                        : "border-border",
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="size-3" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {address.label}
                      {address.isDefault && (
                        <span className="rounded-full bg-card px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-forest uppercase">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                      {[
                        address.line1,
                        address.line2,
                        address.landmark,
                        address.city,
                        address.state,
                        address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="mt-3 rounded-lg border border-border/70 bg-card p-3.5">
          <h3 className="mb-3.5 font-display text-lg leading-none">
            New address
          </h3>
          <AddressForm
            onSaved={async () => {
              setAdding(false);
              await loadAddresses(true);
              toast.success("Address saved");
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-3 text-[11px] font-semibold tracking-[0.14em] text-forest uppercase transition-colors hover:bg-forest-soft/50"
          >
            <Plus className="size-3.5" aria-hidden />
            Add another address
          </button>
        )
      )}

      <Separator className="my-7" />

      <h2 className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-forest uppercase">
        Order summary
      </h2>

      <ul className="space-y-2">
        {cart.items.map((line) => (
          <li key={line.productId} className="flex gap-2.5 text-sm">
            <span className="min-w-0 flex-1 truncate">
              {line.name}
              <span className="text-muted-foreground"> × {line.qty}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPaise(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border/60 pt-3.5 text-sm">
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
        <div className="flex items-baseline justify-between border-t border-border/60 pt-2.5">
          <dt className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            To pay on delivery
          </dt>
          <dd className="text-2xl leading-none font-semibold tracking-tight text-forest-deep tabular-nums">
            {formatPaise(cart.total)}
          </dd>
        </div>
      </dl>

      {/* The label names WhatsApp, because that is literally what the tap does
          — it hands off to WhatsApp with the order prefilled. A button reading
          only "Place order" would make that jump feel like a surprise. */}
      <Button
        onClick={() => void submit()}
        // Address is mandatory: without one there is nowhere to deliver.
        disabled={placing || !selectedId}
        className="rounded-full mt-6 h-13 w-full bg-forest py-4 text-[11px] font-semibold tracking-[0.16em] text-cream uppercase hover:bg-forest-deep disabled:opacity-40"
      >
        <MessageCircle data-icon="inline-start" />
        {placing ? "Placing order" : "Place order on WhatsApp"}
      </Button>

      <p className="mt-2.5 mb-4 text-center text-xs text-muted-foreground">
        {selectedId
          ? "Cash on delivery · we will confirm on WhatsApp"
          : "Choose a delivery address to continue."}
      </p>
    </>
  );
}
