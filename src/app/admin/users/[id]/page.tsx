"use client";

import { ChevronLeft, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/admin/OrderCard";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/admin/States";
import { Separator } from "@/components/ui/separator";
import { formatPaise } from "@/lib/money";
import { getUser, type AdminUserDetail } from "@/services/admin/users";

export default function AdminUserPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      const result = await getUser(params.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDetail(result.data);
    }
    void load();
  }, [params.id]);

  return (
    <>
      <Link
        href="/admin/users"
        className="-ml-1 mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground lg:mb-6"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Customers
      </Link>

      {error && <ErrorState message={error} />}

      {!error && detail === null && <ListSkeleton rows={4} />}

      {detail && (
        // One column on a phone. On desktop the profile sits on the left and
        // stays put while the order history scrolls on the right.
        <div className="lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-10">
            <header className="mb-5">
              <p className="text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                Customer
              </p>
              <h1 className="mt-1.5 flex items-center gap-2 font-display text-2xl leading-none lg:text-4xl">
                {detail.user.name}
                {detail.user.role === "admin" && (
                  <span className="border border-foreground px-1.5 py-0.5 text-[9px] font-medium tracking-[0.1em] uppercase">
                    Admin
                  </span>
                )}
              </h1>

              <a
                href={`tel:+91${detail.user.mobile}`}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm underline decoration-foreground/30 underline-offset-4"
              >
                <Phone className="size-3.5" aria-hidden />
                {detail.user.mobile}
              </a>

              <p className="mt-2 text-xs text-muted-foreground">
                Joined{" "}
                {new Date(detail.user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {!detail.user.isActive && (
                  <span className="text-destructive"> · account disabled</span>
                )}
              </p>
            </header>

            {/* Three numbers only. Accepted total is money actually earned —
                pending orders may never be confirmed. */}
            <dl className="grid grid-cols-3 gap-2.5">
              {[
                ["Orders", String(detail.stats.orderCount)],
                ["Pending", String(detail.stats.pendingCount)],
                ["Spent", formatPaise(detail.stats.acceptedTotal)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-secondary px-3 py-3 text-center"
                >
                  <dd className="text-xl leading-none font-semibold tracking-tight text-forest-deep tabular-nums">
                    {value}
                  </dd>
                  <dt className="mt-1.5 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>

            {detail.user.addresses.length > 0 && (
              <>
                <h2 className="mt-7 mb-3 flex items-center gap-1.5 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                  <MapPin className="size-3.5" aria-hidden />
                  Addresses
                </h2>
                <ul className="space-y-2.5">
                  {detail.user.addresses.map((address) => (
                    <li
                      key={address.id}
                      className="border border-border bg-card px-4 py-3"
                    >
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {address.label}
                        {address.isDefault && (
                          <span className="text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div>
            {/* The columns already separate the two halves on desktop. */}
            <Separator className="my-7 lg:hidden" />

            <h2 className="mb-3 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              Order history
            </h2>

            {detail.orders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                hint="This customer has registered but not ordered."
              />
            ) : (
              <div className="space-y-2.5">
                {detail.orders.map((order) => (
                  <OrderCard key={order.publicId} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
