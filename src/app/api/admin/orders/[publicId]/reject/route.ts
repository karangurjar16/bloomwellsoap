import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";

/** pending -> rejected. No stock change: nothing was ever decremented. */
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/orders/[publicId]/reject">,
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { publicId } = await ctx.params;

  const order = await Order.findOneAndUpdate(
    { publicId, status: "pending" },
    { $set: { status: "rejected" } },
    { returnDocument: "after" },
  );

  if (!order) {
    const existing = await Order.findOne({ publicId }).select("status").lean();
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

  return NextResponse.json({
    ok: true,
    data: { publicId: order.publicId, status: order.status },
  });
}
