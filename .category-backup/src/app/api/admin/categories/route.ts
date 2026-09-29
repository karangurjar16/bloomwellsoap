import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { imageUrl } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import { Category } from "@/models/Category";

// ---------------------------------------------------------------- validation
const logoSchema = z.object({
  path: z.string().trim().min(1),
  provider: z.enum(["local", "cloudinary"]).default("local"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(120).default(""),
});

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  emoji: z.string().trim().max(8).optional(),
  sortOrder: z.number().int().min(0).default(0),
  image: logoSchema.nullish(),
});

// ------------------------------------------------------------------ handlers
/** Admin list: includes inactive categories, which the public route hides. */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return NextResponse.json({
    ok: true,
    data: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      emoji: c.emoji ?? null,
      image: c.image
        ? imageUrl({ key: c.image.path, provider: c.image.provider }, 300)
        : null,
      imageKey: c.image?.path ?? null,
      imageProvider: c.image?.provider ?? null,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
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
      fields[issue.path.join(".")] ??= issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields", fields },
      { status: 422 },
    );
  }

  const { name, emoji, sortOrder, image } = parsed.data;
  const slug = slugify(name);

  // Categories are few and their slugs appear in URLs, so a clash is a real
  // conflict to report rather than something to auto-suffix.
  if (await Category.exists({ slug })) {
    return NextResponse.json(
      { ok: false, error: "A category with this name already exists" },
      { status: 409 },
    );
  }

  const category = await Category.create({
    name,
    slug,
    emoji,
    sortOrder,
    image: image ?? null,
  });

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  );
}
