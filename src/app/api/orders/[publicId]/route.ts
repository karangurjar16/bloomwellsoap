import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { Order } from "@/models/Order";

/**
 * The shared order page — the same URL the customer keeps and the admin opens
 * from WhatsApp. Admin gets `canAccept`; the customer only sees the status.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[publicId]">,
) {
  const { publicId } = await ctx.params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const order = await Order.findOne({ publicId }).lean();

  // 404 for a stranger, not 403: a 403 would confirm the order exists and let
  // someone probe for valid ids.
  const isOwner = order && String(order.userId) === session.userId;
  const isAdmin = session.role === "admin";
  if (!order || (!isOwner && !isAdmin)) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      publicId: order.publicId,
      orderNumber: order.orderNumber,
      status: order.status,
      customer: order.customer,
      address: order.address,
      items: order.items.map((i) => ({
        name: i.name,
        unit: i.unit,
        image: i.image,
        price: i.price,
        qty: i.qty,
        lineTotal: i.lineTotal,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMode: order.paymentMode,
      acceptedAt: order.acceptedAt ?? null,
      createdAt: order.createdAt,
      // Drives the Accept button. The accept route re-checks this server-side;
      // this flag is only for rendering.
      canAccept: isAdmin && order.status === "pending",
      viewerRole: session.role,
    },
  });
}
