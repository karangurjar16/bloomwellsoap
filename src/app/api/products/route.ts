import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { publicProductFilter } from "@/lib/catalogue";
import { imageUrl } from "@/lib/storage";
import { Product } from "@/models/Product";

// ---------------------------------------------------------------- validation
const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});

// -------------------------------------------------------------------- handler
/** Public storefront list. Only active products. */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters" },
      { status: 422 },
    );
  }

  const { q, page, limit } = parsed.data;
  const filter: Record<string, unknown> = await publicProductFilter();

  if (q) {
    // Escaped so a customer typing "(" doesn't crash the query.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Matches the name or the short line: someone searching "gold-plated" or
    // "handloom" is describing the piece, not naming it.
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { tagline: { $regex: safe, $options: "i" } },
    ];
  }

  // Projection matters more than .lean() here: fewer bytes over the wire is
  // the measurable win against a ~31ms round trip.
  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("name slug tagline price mrp unit images stock")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        image: p.images[0]
          ? imageUrl({ key: p.images[0].path, provider: p.images[0].provider }, 500)
          : null,
        inStock: p.stock > 0,
      })),
      total,
      page,
      hasMore: page * limit < total,
    },
  });
}
