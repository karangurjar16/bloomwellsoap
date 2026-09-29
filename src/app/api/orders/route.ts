import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { DELIVERY_FEE, FREE_DELIVERY_OVER } from "@/lib/constants";
import { publicProductFilter } from "@/lib/catalogue";
import { imageUrl } from "@/lib/storage";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const checkoutSchema = z.object({
  addressId: z.string().trim().min(1, "Choose a delivery address"),
});

// -------------------------------------------------------------------- handler
/**
 * Checkout. Saves the order first and returns a WhatsApp deep link; the client
 * then navigates to it. If the customer never presses send in WhatsApp, the
 * order still exists and shows up in the admin panel.
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

  const parsed = checkoutSchema.safeParse(body);
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

  const userId = auth.session.userId;

  const user = await User.findById(userId).select("name mobile addresses");
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const address = user.addresses.id(parsed.data.addressId);
  if (!address) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields",
        fields: { addressId: "Choose a delivery address" },
      },
      { status: 422 },
    );
  }

  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Your cart is empty" },
      { status: 409 },
    );
  }

  // Prices are read fresh here and never taken from the request: otherwise a
  // crafted body could buy a ₹490 shampoo for ₹1.
  const products = await Product.find(
    await publicProductFilter({
      _id: { $in: cart.items.map((i) => i.productId) },
    }),
  )
    .select("name unit price mrp images stock")
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items: OrderItem[] = [];
  for (const line of cart.items) {
    const product = byId.get(String(line.productId));
    if (!product) continue; // removed from the catalogue since it was added

    const qty = Math.min(line.qty, product.stock);
    if (qty < 1) continue; // out of stock now

    items.push({
      productId: product._id,
      name: product.name,
      unit: product.unit,
      // A resolved URL, not a key: the order is a historical record and must
      // keep rendering even if storage moves later.
      image: product.images[0]
        ? imageUrl(
            { key: product.images[0].path, provider: product.images[0].provider },
            300,
          )
        : "",
      price: product.price,
      qty,
      lineTotal: product.price * qty,
    });
  }

  if (items.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nothing in your cart is available any more. Please review it.",
      },
      { status: 409 },
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

  const order = await Order.create({
    userId,
    customer: { name: user.name, mobile: user.mobile },
    address: {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark,
    },
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: "pending",
    paymentMode: "cod",
  });

  // Cleared only after the order is safely written.
  await Cart.updateOne({ userId }, { $set: { items: [] } });

  const origin = req.nextUrl.origin;
  const orderUrl = `${origin}/order/${order.publicId}`;

  const waUrl = whatsappLink(
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
      orderUrl,
    ),
  );

  return NextResponse.json(
    {
      ok: true,
      data: {
        publicId: order.publicId,
        orderNumber: order.orderNumber,
        total: order.total,
        orderUrl,
        waUrl,
      },
    },
    { status: 201 },
  );
}

/** "My orders" list. */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const orders = await Order.find({ userId: auth.session.userId })
    .select("orderNumber publicId total status items createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    ok: true,
    data: orders.map((o) => ({
      publicId: o.publicId,
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      itemCount: o.items.reduce((sum, i) => sum + i.qty, 0),
      firstItem: o.items[0]?.name ?? "",
      createdAt: o.createdAt,
    })),
  });
}
