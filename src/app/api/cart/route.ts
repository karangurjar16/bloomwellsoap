import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { DELIVERY_FEE, FREE_DELIVERY_OVER } from "@/lib/constants";
import { publicProductFilter } from "@/lib/catalogue";
import { imageUrl } from "@/lib/storage";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const putItemSchema = z.object({
  productId: z.string().refine(isValidObjectId, "Unknown product"),
  // Absolute quantity, not a delta: a retried tap on a flaky mobile connection
  // must not silently add the item twice. 0 removes the line.
  qty: z.number().int().min(0).max(99),
});

// -------------------------------------------------------------------- helpers
/**
 * Builds the cart view. Prices are read live from Product rather than stored on
 * the cart, so a price change is never hidden from the customer.
 */
async function buildCart(userId: string) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    return { items: [], subtotal: 0, savings: 0, deliveryFee: 0, total: 0 };
  }

  const products = await Product.find(
    await publicProductFilter({
      _id: { $in: cart.items.map((i) => i.productId) },
    }),
  )
    .select("name slug price mrp unit images stock")
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const item of cart.items) {
    const product = byId.get(String(item.productId));
    // Silently drops products deleted since they were added.
    if (!product) continue;

    // Never show more than is actually in stock.
    const qty = Math.min(item.qty, product.stock);
    if (qty < 1) continue;

    items.push({
      productId: String(product._id),
      name: product.name,
      slug: product.slug,
      unit: product.unit,
      image: product.images[0]
        ? imageUrl(
            { key: product.images[0].path, provider: product.images[0].provider },
            200,
          )
        : null,
      price: product.price,
      mrp: product.mrp,
      qty,
      lineTotal: product.price * qty,
      // Surfaced so the UI can explain a quantity that shrank.
      stock: product.stock,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const savings = items.reduce((s, i) => s + (i.mrp - i.price) * i.qty, 0);
  const deliveryFee =
    subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

  return { items, subtotal, savings, deliveryFee, total: subtotal + deliveryFee };
}

// ------------------------------------------------------------------ handlers
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  return NextResponse.json({
    ok: true,
    data: await buildCart(auth.session.userId),
  });
}

/** Set the quantity of one product. qty 0 removes it. */
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

  const parsed = putItemSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] ??= issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields", fields },
      { status: 422 },
    );
  }

  const { productId, qty } = parsed.data;
  const userId = auth.session.userId;

  const product = await Product.findOne(
    await publicProductFilter({ _id: productId }),
  )
    .select("stock")
    .lean();
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "This product is no longer available" },
      { status: 404 },
    );
  }

  if (qty > product.stock) {
    return NextResponse.json(
      {
        ok: false,
        error:
          product.stock === 0
            ? "This product is out of stock"
            : `Only ${product.stock} left in stock`,
      },
      { status: 409 },
    );
  }

  if (qty === 0) {
    await Cart.updateOne({ userId }, { $pull: { items: { productId } } });
  } else {
    // Two writes because the item may or may not already be in the array.
    // upsert creates the cart on a customer's first add.
    const updated = await Cart.updateOne(
      { userId, "items.productId": productId },
      { $set: { "items.$.qty": qty } },
    );
    if (updated.matchedCount === 0) {
      await Cart.updateOne(
        { userId },
        { $push: { items: { productId, qty } } },
        { upsert: true },
      );
    }
  }

  return NextResponse.json({ ok: true, data: await buildCart(userId) });
}

/** Empty the cart. */
export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  await Cart.updateOne(
    { userId: auth.session.userId },
    { $set: { items: [] } },
  );

  return NextResponse.json({
    ok: true,
    data: { items: [], subtotal: 0, savings: 0, deliveryFee: 0, total: 0 },
  });
}
