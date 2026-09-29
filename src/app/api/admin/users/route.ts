import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const PAGE_SIZE = 25;

// -------------------------------------------------------------------- handler
/**
 * Customer list with order counts.
 *
 * Stats are gathered in one aggregate over just this page's users rather than a
 * query per row — 25 users would otherwise mean 25 extra round trips.
 */
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

  const { q, page } = parsed.data;
  const filter: Record<string, unknown> = {};

  if (q) {
    // Escaped so a stray "(" can't break the query.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { mobile: { $regex: safe, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    // password is select:false on the schema, so it cannot leak here even by
    // accident — but the projection is explicit anyway.
    User.find(filter)
      .select("name mobile role isActive addresses createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments(filter),
  ]);

  const stats = await Order.aggregate<{
    _id: unknown;
    orderCount: number;
    acceptedTotal: number;
    lastOrderAt: Date;
  }>([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: "$userId",
        orderCount: { $sum: 1 },
        // Only accepted orders count as money earned; pending ones may never
        // be confirmed.
        acceptedTotal: {
          $sum: { $cond: [{ $eq: ["$status", "accepted"] }, "$total", 0] },
        },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);

  const byUser = new Map(stats.map((s) => [String(s._id), s]));

  return NextResponse.json({
    ok: true,
    data: {
      users: users.map((u) => {
        const stat = byUser.get(String(u._id));
        return {
          id: String(u._id),
          name: u.name,
          mobile: u.mobile,
          role: u.role,
          isActive: u.isActive,
          addressCount: u.addresses.length,
          orderCount: stat?.orderCount ?? 0,
          acceptedTotal: stat?.acceptedTotal ?? 0,
          lastOrderAt: stat?.lastOrderAt ?? null,
          createdAt: u.createdAt,
        };
      }),
      total,
      page,
      hasMore: page * PAGE_SIZE < total,
    },
  });
}
