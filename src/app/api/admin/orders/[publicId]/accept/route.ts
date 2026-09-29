import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

/**
 * pending -> accepted, and stock comes down here rather than at checkout: with
 * cash on delivery the admin accepting the order is the real confirmation.
 */
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[publicId]/accept">,
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { publicId } = await ctx.params;

  // status is part of the query, not a separate read: two taps on a slow
  // connection would otherwise both pass a read-then-write check and
  // decrement stock twice.
  const order = await Order.findOneAndUpdate(
    { publicId, status: "pending" },
    { $set: { status: "accepted", acceptedAt: new Date() } },
    { returnDocument: "after" },
  );

  if (!order) {
    // Either it doesn't exist, or it was already handled.
    const existing = await Order.findOne({ publicId })
      .select("status")
      .lean();

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: `This order is already ${existing.status}`,
        data: { status: existing.status },
      },
      { status: 409 },
    );
  }

  // Best effort: the order is already accepted, so a stock write that fails
  // must not undo that. $inc is atomic per product.
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.qty } },
      ),
    ),
  );

  return NextResponse.json({
    ok: true,
    data: {
      publicId: order.publicId,
      status: order.status,
      acceptedAt: order.acceptedAt,
    },
  });
}
