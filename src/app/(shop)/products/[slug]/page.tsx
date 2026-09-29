import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartBar } from "@/components/shop/AddToCartBar";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { Separator } from "@/components/ui/separator";
import { discountPercent, formatPaise } from "@/lib/money";
import { publicProductFilter } from "@/lib/catalogue";
import { imageUrl } from "@/lib/storage";
import { Product } from "@/models/Product";
import type { ShopProduct } from "@/services/shop/catalogue";

/**
 * Per request, not prerendered: price and stock have to be current, and the
 * build must not depend on a reachable database.
 */
export const dynamic = "force-dynamic";

async function findProduct(slug: string) {
  return Product.findOne(await publicProductFilter({ slug })).lean();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.name} — Bloomwell`,
    description: product.tagline || product.description.slice(0, 150),
    // The share card matters: these links get pasted into WhatsApp.
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: product.images[0]
        ? [
            {
              url: imageUrl(
                {
                  key: product.images[0].path,
                  provider: product.images[0].provider,
                },
                1200,
              ),
            },
          ]
        : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();

  // The newest other products, so a shopper always has somewhere to go next.
  const related = await Product.find(
    await publicProductFilter({ _id: { $ne: product._id } }),
  )
    .select("name slug tagline price mrp unit images stock")
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const off = discountPercent(product.price, product.mrp);
  const inStock = product.stock > 0;

  const relatedProducts: ShopProduct[] = related.map((p) => ({
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
  }));

  return (
    <>
      {/* Gallery bleeds past the layout padding — a full-width image is the
          whole point of a product page on a phone. On desktop the page splits
          in two: the gallery stays pinned on the left while the details
          scroll on the right. */}
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-10 md:pt-8 lg:gap-16">
        <div className="-mx-5 md:sticky md:top-28 md:mx-0 md:overflow-hidden md:rounded-[2rem]">
          <div className="relative">
            <ProductGallery
              images={product.images.map((i) => ({
                url: imageUrl({ key: i.path, provider: i.provider }, 900),
                alt: i.alt,
              }))}
              name={product.name}
            />

            <Link
              href="/products"
              aria-label="Back"
              className="absolute top-3 left-3 grid size-10 place-items-center rounded-full bg-cream/90 text-forest-deep shadow-sm backdrop-blur transition-colors hover:bg-cream"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="pt-6 md:pt-2">
          <h1 className="font-display text-3xl leading-tight font-bold text-forest-deep uppercase md:text-5xl">
            {product.name}
          </h1>

          {product.tagline && (
            <p className="mt-2 text-sm text-muted-foreground">{product.tagline}</p>
          )}

          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl leading-none font-semibold tracking-tight text-gold-deep tabular-nums">
              {formatPaise(product.price)}
            </span>
            {off > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPaise(product.mrp)}
                </span>
                <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-forest-deep uppercase">
                  {off}% off
                </span>
              </>
            )}
          </div>

          <dl className="mt-5 space-y-2 rounded-lg bg-forest-soft/60 px-4 py-3.5 text-sm">
            {product.unit && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-muted-foreground">Pack</dt>
                <dd>{product.unit}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-muted-foreground">Availability</dt>
              <dd className={inStock ? "" : "text-destructive"}>
                {inStock
                  ? product.stock <= 3
                    ? `Only ${product.stock} left`
                    : "In stock"
                  : "Sold out"}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-muted-foreground">Payment</dt>
              <dd>Cash on delivery</dd>
            </div>
          </dl>

          {product.description && (
            <>
              <Separator className="my-6" />
              <h2 className="mb-2.5 text-[10px] font-semibold tracking-[0.2em] text-forest uppercase">
                Details
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Outside the two columns, so related products get the full width. */}
      {relatedProducts.length > 0 && (
        <>
          <Separator className="my-9 md:my-14" />
          <h2 className="mb-5 font-display text-2xl leading-none font-bold text-forest-deep uppercase md:mb-7 md:text-3xl">
            You may also like
          </h2>
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-7 md:gap-x-5">
            {relatedProducts.map((item) => (
              <li
                key={item.id}
                className="w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-3.75rem)/4)]"
              >
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </>
      )}

      <AddToCartBar
        productId={String(product._id)}
        slug={product.slug}
        price={product.price}
        inStock={inStock}
      />
    </>
  );
}
