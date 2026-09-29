import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

/**
 * One customer with their full order history and saved addresses.
 *
 * Orders are read by userId rather than by the snapshot on the order, so a
 * customer who later changed their name still shows every order they placed.
 */
export async function GET(
  _req: NextRequest,
  // Typed explicitly rather than with RouteContext: that helper is generated
  // from the route tree at build time, so a new route isn't in it yet.
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  const user = await User.findById(id)
    .select("name mobile role isActive addresses createdAt")
    .lean();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  const orders = await Order.find({ userId: user._id })
    .select("orderNumber publicId customer total status items createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const accepted = orders.filter((o) => o.status === "accepted");

  return NextResponse.json({
    ok: true,
    data: {
      user: {
        id: String(user._id),
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        addresses: user.addresses.map((a) => ({
          id: String(a._id),
          label: a.label,
          line1: a.line1,
          line2: a.line2 ?? null,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          landmark: a.landmark ?? null,
          isDefault: a.isDefault,
        })),
      },
      stats: {
        orderCount: orders.length,
        acceptedCount: accepted.length,
        pendingCount: orders.filter((o) => o.status === "pending").length,
        // Money actually earned, so pending orders are excluded.
        acceptedTotal: accepted.reduce((sum, o) => sum + o.total, 0),
      },
      // Shaped like the admin order list so OrderCard renders it unchanged.
      orders: orders.map((o) => ({
        publicId: o.publicId,
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        customerMobile: o.customer.mobile,
        total: o.total,
        status: o.status,
        itemCount: o.items.reduce((sum, i) => sum + i.qty, 0),
        createdAt: o.createdAt,
      })),
    },
  });
}
