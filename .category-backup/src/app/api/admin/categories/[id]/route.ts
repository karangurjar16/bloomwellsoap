import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { imageUrl } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const logoSchema = z.object({
  path: z.string().trim().min(1),
  provider: z.enum(["local", "cloudinary"]).default("local"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(120).default(""),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    emoji: z.string().trim().max(8).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    // null clears the logo and falls back to the emoji.
    image: logoSchema.nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// ------------------------------------------------------------------ handlers
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/categories/[id]">,
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

  // Renaming re-derives the slug, so a typo fixed in the admin panel doesn't
  // leave the old wording in the URL.
  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name) {
    const slug = slugify(parsed.data.name);
    const clash = await Category.exists({ slug, _id: { $ne: id } });
    if (clash) {
      return NextResponse.json(
        { ok: false, error: "A category with this name already exists" },
        { status: 409 },
      );
    }
    update.slug = slug;
  }

  const category = await Category.findByIdAndUpdate(id, update, { returnDocument: "after" });
  if (!category) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      emoji: category.emoji ?? null,
      image: category.image
        ? imageUrl(
            { key: category.image.path, provider: category.image.provider },
            300,
          )
        : null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/categories/[id]">,
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

  // A product whose category vanished would disappear from every tab, so this
  // is refused rather than cascaded.
  const inUse = await Product.exists({ categoryId: id });
  if (inUse) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This category still has products. Move them first, or hide the category instead.",
      },
      { status: 409 },
    );
  }

  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
