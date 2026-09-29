import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { Order } from "@/models/Order";

// ---------------------------------------------------------------- validation
const querySchema = z.object({
  // Defaults to the queue the admin actually needs to act on.
  status: z.enum(["pending", "accepted", "rejected", "all"]).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
});

// -------------------------------------------------------------------- handler
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters" },
      { status: 422 },
    );
  }

  const { status, page } = parsed.data;
  const limit = 30;
  const filter = status === "all" ? {} : { status };

  const [orders, total, pendingCount] = await Promise.all([
    Order.find(filter)
      .select("orderNumber publicId customer total status items createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
    // Badge count for the admin nav.
    Order.countDocuments({ status: "pending" }),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
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
      total,
      pendingCount,
      page,
      hasMore: page * limit < total,
      statuses: ORDER_STATUSES,
    },
  });
}
