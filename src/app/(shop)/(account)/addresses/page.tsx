"use client";

import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressForm } from "@/components/shop/AddressForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteAddress,
  listAddresses,
  updateAddress,
  type Address,
} from "@/services/shop/addresses";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const result = await listAddresses();
    if (!result.ok) {
      // 401 is the signed-out case, not a failure worth shouting about.
      if (/sign(ed)? in/i.test(result.error)) {
        setNeedsLogin(true);
        setAddresses([]);
        return;
      }
      toast.error(result.error);
      setAddresses([]);
      return;
    }
    setAddresses(result.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function makeDefault(address: Address) {
    setBusyId(address.id);
    const result = await updateAddress(address.id, { isDefault: true });
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${address.label} is now the default`);
    await refresh();
  }

  async function remove(address: Address) {
    if (!window.confirm(`Delete the "${address.label}" address?`)) return;

    setBusyId(address.id);
    const result = await deleteAddress(address.id);
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Address deleted");
    await refresh();
  }

  if (addresses === null) {
    return (
      <div className="space-y-3 pt-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="pt-16 text-center">
        <MapPin className="mx-auto size-8 text-forest" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-2xl leading-none">
          Your addresses
        </h1>
        <p className="mx-auto mt-2.5 max-w-xs text-sm text-muted-foreground">
          Sign in to save where your orders should go.
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

  return (
    <>
      <header className="pt-8 pb-5">
        <h1 className="font-display text-3xl leading-none">Your addresses</h1>
        <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {addresses.length} saved
        </p>
      </header>

      {addresses.length > 0 && (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-lg border border-border/70 bg-card p-3.5"
            >
              {editingId === address.id ? (
                <AddressForm
                  address={address}
                  onSaved={async () => {
                    setEditingId(null);
                    toast.success("Address updated");
                    await refresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {address.label}
                        {address.isDefault && (
                          <span className="rounded-full bg-forest-soft px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-forest uppercase">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2.5">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => void makeDefault(address)}
                        disabled={busyId === address.id}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium tracking-[0.08em] text-forest uppercase disabled:opacity-40"
                      >
                        <Star className="size-3.5" aria-hidden />
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(address.id)}
                      className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(address)}
                      disabled={busyId === address.id}
                      aria-label={`Delete ${address.label}`}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="mt-4 rounded-lg border border-border/70 bg-card p-3.5">
          <h2 className="mb-3.5 font-display text-lg leading-none">
            New address
          </h2>
          <AddressForm
            onSaved={async () => {
              setAdding(false);
              toast.success("Address saved");
              await refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="rounded-full mt-4 h-12 w-full border-forest/30 text-[11px] font-semibold tracking-[0.14em] text-forest uppercase hover:bg-forest-soft"
        >
          <Plus data-icon="inline-start" />
          Add {addresses.length > 0 ? "another" : "an"} address
        </Button>
      )}
    </>
  );
}
