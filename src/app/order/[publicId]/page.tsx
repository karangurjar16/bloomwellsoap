import { ChevronLeft, Phone, Send } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { OrderActions } from "@/components/admin/OrderActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { imageSrc } from "@/lib/storage";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatPaise } from "@/lib/money";
import { Order } from "@/models/Order";

/**
 * A WhatsApp message needs a tappable absolute link, and a server component has
 * no request URL — so the origin is rebuilt from the proxy headers.
 */
async function absoluteOrderUrl(publicId: string) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}/order/${publicId}`;
}

/**
 * The shared order page — the same URL the customer keeps and the admin opens
 * from WhatsApp. Server-rendered so a tap from WhatsApp shows content
 * immediately, with the accept/reject buttons as the only client island.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const order = await Order.findOne({ publicId }).lean();

  // 404 for a stranger rather than 403: a 403 would confirm the order exists
  // and let someone probe for valid ids.
  const isOwner = order && String(order.userId) === session.userId;
  const isAdmin = session.role === "admin";
  if (!order || (!isOwner && !isAdmin)) notFound();

  const canAccept = isAdmin && order.status === "pending";

  // A resend link for the customer: the WhatsApp handoff depends on them
  // pressing send, and nothing on the server can tell whether they did.
  const resendUrl =
    !isAdmin && order.status === "pending"
      ? whatsappLink(
          buildOrderMessage(
            {
              orderNumber: order.orderNumber,
              customer: order.customer,
              address: order.address,
              items: order.items,
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              total: order.total,
            },
            await absoluteOrderUrl(order.publicId),
          ),
        )
      : null;
  const placed = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    // The page is shared, so it adopts the theme of whoever opened it: the
    // panel palette for an admin coming from the queue, the shop palette for a
    // customer coming from their orders.
    <main className={cn("min-h-dvh bg-background text-foreground", isAdmin ? "admin" : "shop")}>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
          <Link
            href={isAdmin ? "/admin/orders" : "/"}
            className="-ml-1 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {isAdmin ? "Orders" : "Shop"}
          </Link>
          <BrandMark size="sm" wordmark={false} className="ml-auto" />
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
            {order.orderNumber}
          </p>
          <h1 className="mt-2 text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {formatPaise(order.total)}
          </h1>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Placed {placed}</p>
        </div>

        <Separator className="my-6" />

        <h2 className="mb-3 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Items
        </h2>
        <ul className="space-y-2.5">
          {order.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center gap-3 border border-border bg-card p-2.5"
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc(item.image) ?? ""}
                  alt=""
                  className="size-14 shrink-0 border border-border object-cover"
                />
              ) : (
                <span className="size-14 shrink-0 border border-dashed border-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.unit ? `${item.unit} · ` : ""}
                  {formatPaise(item.price)} × {item.qty}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatPaise(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border border-border bg-card px-4 py-3.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPaise(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Delivery</dt>
            <dd className="tabular-nums">
              {order.deliveryFee === 0 ? "Free" : formatPaise(order.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPaise(order.total)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-xs text-muted-foreground">
            <dt>Payment</dt>
            <dd className="uppercase">Cash on delivery</dd>
          </div>
        </dl>

        <Separator className="my-6" />

        <h2 className="mb-3 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Deliver to
        </h2>
        <div className="border border-border bg-card px-4 py-3.5 text-sm">
          <p className="font-medium">{order.customer.name}</p>
          <p className="mt-1 text-muted-foreground">
            {[
              order.address.line1,
              order.address.line2,
              order.address.landmark,
              order.address.city,
              order.address.state,
              order.address.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>

          {/* Tap to call — the admin's fastest way to confirm an order. */}
          <a
            href={`tel:+91${order.customer.mobile}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline decoration-foreground/30 underline-offset-4"
          >
            <Phone className="size-3.5" aria-hidden />
            {order.customer.mobile}
          </a>
        </div>

        {canAccept && (
          <>
            <Separator className="my-6" />
            <OrderActions publicId={order.publicId} />
          </>
        )}

        {!isAdmin && order.status === "pending" && (
          <>
            {resendUrl && (
              <a
                href={resendUrl}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold text-[11px] font-semibold tracking-[0.16em] text-forest-deep uppercase"
              >
                <Send className="size-4" aria-hidden />
                Send on WhatsApp
              </a>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We have your order. You will get a call once it is confirmed.
            </p>
          </>
        )}
      </div>

      <Toaster position="top-center" />
    </main>
  );
}
