import { NextResponse, type NextRequest } from "next/server";
import { publicProductFilter } from "@/lib/catalogue";
import { imageUrl } from "@/lib/storage";
import { Product } from "@/models/Product";

/** Public: product detail page. */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/products/[slug]">,
) {
  const { slug } = await ctx.params;

  const product = await Product.findOne(
    await publicProductFilter({ slug }),
  ).lean();
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Product not found" },
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
      images: product.images.map((i) => ({
        url: imageUrl({ key: i.path, provider: i.provider }, 900),
        width: i.width,
        height: i.height,
        alt: i.alt,
      })),
      inStock: product.stock > 0,
    },
  });
}
