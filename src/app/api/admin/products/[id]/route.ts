import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { imageUrl } from "@/lib/storage";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const imageSchema = z.object({
  path: z.string().trim().min(1),
  provider: z.enum(["local", "cloudinary"]).default("local"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(120).default(""),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(140).optional(),
    description: z.string().trim().max(4000).optional(),
    tagline: z.string().trim().max(120).optional(),
    price: z.number().int().min(0).optional(),
    mrp: z.number().int().min(0).optional(),
    unit: z.string().trim().max(40).optional(),
    images: z.array(imageSchema).max(8).optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// ------------------------------------------------------------------ handlers
/**
 * Single product for the edit form. Separate from the public route, which
 * filters on isActive — an admin must be able to edit a hidden product.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]">,
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: String(product._id),
      name: product.name,
      slug: product.slug,
      description: product.description,
      tagline: product.tagline,
      price: product.price,
      mrp: product.mrp,
      unit: product.unit,
      stock: product.stock,
      isActive: product.isActive,
      images: product.images.map((i) => ({
        path: i.path,
        provider: i.provider ?? "local",
        width: i.width,
        height: i.height,
        alt: i.alt,
        url: imageUrl({ key: i.path, provider: i.provider }, 400),
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]">,
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const parsed = updateSchema.safeParse(body);
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

  const existing = await Product.findById(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  // Compare against the saved values, since a PATCH may send only one of them.
  const nextPrice = data.price ?? existing.price;
  const nextMrp = data.mrp ?? existing.mrp;
  if (nextMrp < nextPrice) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields",
        fields: { mrp: "MRP cannot be less than the selling price" },
      },
      { status: 422 },
    );
  }

  // The slug is intentionally left alone on rename: it is already shared in
  // WhatsApp messages and bookmarks.
  const product = await Product.findByIdAndUpdate(id, data, { returnDocument: "after" });

  return NextResponse.json({
    ok: true,
    data: { id: String(product!._id), slug: product!.slug },
  });
}

/** Soft delete: old orders still reference this product's name and image. */
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/products/[id]">,
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false },
    { returnDocument: "after" },
  );
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: { hidden: true } });
}
