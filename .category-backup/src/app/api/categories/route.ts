import { NextResponse } from "next/server";
import { imageUrl } from "@/lib/storage";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";

/**
 * Public: the collections shown on the home page.
 *
 * Each category carries a product count and a cover image, gathered in one
 * aggregate rather than a request per tile — a category tile with no picture
 * and no sense of how much is inside gives a shopper nothing to act on.
 */
export async function GET() {
  const categories = await Category.find({ isActive: true })
    .select("name slug emoji image sortOrder")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Only a count. The tile picture is the category logo the admin chose, not
  // whichever product happened to be added last.
  const counts = await Product.aggregate<{ _id: unknown; count: number }>([
    { $match: { isActive: true } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);

  const countByCategory = new Map(
    counts.map((c) => [String(c._id), c.count]),
  );

  return NextResponse.json({
    ok: true,
    data: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      emoji: c.emoji ?? null,
      productCount: countByCategory.get(String(c._id)) ?? 0,
      image: c.image
        ? imageUrl({ key: c.image.path, provider: c.image.provider }, 600)
        : null,
    })),
  });
}
