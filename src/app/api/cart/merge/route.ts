import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const mergeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().refine(isValidObjectId),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .max(50),
});

/**
 * Called once, right after login: folds the localStorage guest cart into the
 * saved one so items chosen before signing in aren't lost.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid cart payload" },
      { status: 422 },
    );
  }

  const userId = auth.session.userId;
  const incoming = parsed.data.items;

  if (incoming.length === 0) {
    return NextResponse.json({ ok: true, data: { merged: 0 } });
  }

  // Drop anything deleted or out of stock since it was added on the device.
  const live = await Product.find({
    _id: { $in: incoming.map((i) => i.productId) },
    isActive: true,
    stock: { $gt: 0 },
  })
    .select("_id stock")
    .lean();

  const stockById = new Map(live.map((p) => [String(p._id), p.stock]));

  const cart = (await Cart.findOne({ userId })) ?? new Cart({ userId, items: [] });

  let merged = 0;
  for (const item of incoming) {
    const stock = stockById.get(item.productId);
    if (stock === undefined) continue;

    const existing = cart.items.find(
      (i) => String(i.productId) === item.productId,
    );
    // Takes the larger quantity rather than summing: the guest cart usually
    // represents the same intent as the saved one, not an additional order.
    const qty = Math.min(Math.max(existing?.qty ?? 0, item.qty), stock);

    if (existing) existing.qty = qty;
    else cart.items.push({ productId: item.productId, qty } as never);
    merged++;
  }

  await cart.save();

  return NextResponse.json({ ok: true, data: { merged } });
}
