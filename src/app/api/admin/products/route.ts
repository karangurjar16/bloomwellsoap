import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { imageUrl } from "@/lib/storage";
import { uniqueSlug } from "@/lib/slug";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const imageSchema = z.object({
  // Comes from POST /api/admin/upload, which already wrote the file to disk.
  path: z.string().trim().min(1),
  provider: z.enum(["local", "cloudinary"]).default("local"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(120).default(""),
});

const createSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(140),
    description: z.string().trim().max(4000).default(""),
    tagline: z.string().trim().max(120).default(""),
    // Paise. The admin form shows rupees and multiplies by 100 before sending.
    price: z.number().int().min(0, "Price is required"),
    mrp: z.number().int().min(0),
    unit: z.string().trim().max(40).default(""),
    images: z.array(imageSchema).max(8).default([]),
    stock: z.number().int().min(0).default(0),
  })
  .refine((v) => v.mrp >= v.price, {
    message: "MRP cannot be less than the selling price",
    path: ["mrp"],
  });

// ------------------------------------------------------------------ handlers
/** Admin list: includes inactive and out-of-stock, which the public list hides. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1) || 1;
  const limit = 30;

  const [products, total] = await Promise.all([
    Product.find()
      .select("name slug price mrp stock isActive images createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        isActive: p.isActive,
        image: p.images[0]
          ? imageUrl({ key: p.images[0].path, provider: p.images[0].provider }, 200)
          : null,
      })),
      total,
      page,
      hasMore: page * limit < total,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".") || "form"] ??= issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields", fields },
      { status: 422 },
    );
  }

  const data = parsed.data;

  const product = await Product.create({
    ...data,
    // Random suffix: two products may legitimately share a name.
    slug: uniqueSlug(data.name),
    createdBy: auth.session.userId,
  });

  return NextResponse.json(
    {
      ok: true,
      data: { id: String(product._id), slug: product.slug },
    },
    { status: 201 },
  );
}
