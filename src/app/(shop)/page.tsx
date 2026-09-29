import { MessageCircle, Truck, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoMark from "@/assets/brand/logo-mark.png";
import {
  Bloom,
  Daisy,
  FallingPetals,
  LeafSprig,
} from "@/components/shop/Botanicals";
import {
  PillLink,
  RotatingBadge,
  SectionTitle,
  Sparkle,
} from "@/components/shop/Decor";
import { ProductRail } from "@/components/shop/ProductRail";
import { publicProductFilter } from "@/lib/catalogue";
import { DELIVERY_FEE, FREE_DELIVERY_OVER } from "@/lib/constants";
import { formatPaise } from "@/lib/money";
import { imageUrl } from "@/lib/storage";
import { Product } from "@/models/Product";
import type { ShopProduct } from "@/services/shop/catalogue";

/**
 * Rendered per request. Without this Next would try to prerender the page at
 * build time, which means the build needs a reachable database and bakes in
 * whatever the catalogue looked like then — so an admin edit wouldn't show
 * until the next deploy. Swap to `export const revalidate = 60` if the DB read
 * per visit ever becomes the bottleneck.
 */
export const dynamic = "force-dynamic";

/**
 * Home is a shop window, not a catalogue: a hero with a product in an arch,
 * the newest products, a line about the shop and why to buy here. Everything for sale lives on /products.
 *
 * The photos in the hero and the story block are borrowed from the newest
 * products that have one, so the page dresses itself from the catalogue; with
 * no photos yet, the logo's "B" stands in.
 *
 * Rendered on the server and reading the models directly — a shopper sees
 * product photos immediately instead of skeletons, and there's no request
 * waterfall on a phone connection.
 */
export default async function HomePage() {
  const newest = await Product.find(await publicProductFilter())
    .select("name slug tagline price mrp unit images stock")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const products: ShopProduct[] = newest.map((p) => ({
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

  // Larger renditions of the first two product photos, for the hero arch and
  // the story card.
  const [heroDoc, storyDoc] = newest.filter((p) => p.images[0]);
  const photo = (doc: typeof heroDoc | undefined) =>
    doc
      ? imageUrl(
          { key: doc.images[0].path, provider: doc.images[0].provider },
          900,
        )
      : null;
  const heroImage = photo(heroDoc);
  const storyImage = photo(storyDoc ?? heroDoc);

  return (
    <>
      {/* Hero on a warm honey wash, bleeding past the layout padding on a
          phone and a rounded panel on desktop. Copy on the left, a product
          framed in an arch on the right. */}
      <section className="relative -mx-5 mb-12 overflow-hidden bg-gradient-to-br from-cream via-gold-soft/80 to-gold-soft px-5 pt-10 pb-14 md:mx-0 md:mt-6 md:mb-20 md:rounded-[2rem] md:px-12 md:py-16 lg:px-20 lg:py-20">
        {/* Soft honey glow behind the headline. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-gold/25 blur-3xl"
        />

        {/* The garden: petals falling through the panel, a sprig swaying in
            each lower corner, a daisy floating by the headline. */}
        <FallingPetals fall={900} />
        <LeafSprig className="absolute -bottom-3 left-2 h-32 animate-sway text-forest/20 motion-reduce:animate-none md:left-6 md:h-44" />
        <LeafSprig className="absolute -right-2 -bottom-4 h-28 -scale-x-100 animate-sway text-forest/15 [animation-delay:-3s] motion-reduce:animate-none md:h-40" />
        <Daisy className="absolute top-8 right-6 size-10 animate-float text-blush-deep motion-reduce:animate-none md:top-10 md:right-1/2 md:size-12" />

        <div className="relative grid items-center gap-12 md:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            {/* The copy rises in line by line on arrival. */}
            <p className="flex animate-fade-up items-center gap-2 text-[10px] font-semibold tracking-[0.24em] text-gold-deep uppercase motion-reduce:animate-none md:text-xs">
              <Sparkle className="size-3 text-gold" />
              Soaps · Shampoos · Body care
            </p>
            <SectionTitle
              as="h1"
              lead="Gentle care,"
              accent="naturally"
              tail="yours"
              className="mt-4 animate-fade-up text-[2.7rem] leading-[1.02] [animation-delay:120ms] motion-reduce:animate-none md:mt-5 md:text-6xl lg:text-7xl"
            />
            <p className="mt-5 max-w-md animate-fade-up text-sm leading-relaxed text-muted-foreground [animation-delay:240ms] motion-reduce:animate-none md:mt-6 md:text-base">
              Everyday soaps and shampoos, made to be kind to skin and hair —
              delivered to your door. Pay when it reaches you.
            </p>

            <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:360ms] motion-reduce:animate-none">
              <PillLink href="/products">Shop now</PillLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[19rem] animate-fade-up [animation-delay:300ms] motion-reduce:animate-none md:max-w-sm">
            {/* A big bloom turning slowly behind the arch. */}
            <Bloom className="absolute -top-14 -left-16 size-44 animate-spin-slower text-blush-deep/80 motion-reduce:animate-none md:-left-24 md:size-56" />
            {/* Hairline arch offset behind the photo, and a few sparkles. */}
            <span
              aria-hidden
              className="absolute -top-4 -right-4 h-full w-full rounded-t-full rounded-b-[2rem] border border-gold/70"
            />
            <Sparkle className="absolute -top-2 -left-3 z-10 size-5 animate-pulse text-gold motion-reduce:animate-none" />
            <Sparkle className="absolute top-1/3 -right-8 size-3.5 animate-pulse text-gold/80 [animation-delay:700ms] motion-reduce:animate-none" />
            <Sparkle className="absolute -bottom-6 left-1/3 size-4 text-forest/40" />

            <div className="relative aspect-[4/5] animate-float overflow-hidden rounded-t-full rounded-b-[2rem] bg-blush shadow-[0_30px_60px_-30px_rgba(154,100,18,0.55)] [animation-duration:9s] motion-reduce:animate-none">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={heroDoc?.name ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center">
                  <Image
                    src={logoMark}
                    alt=""
                    loading="eager"
                    className="h-2/5 w-auto opacity-90"
                  />
                </div>
              )}
            </div>

            {heroDoc && (
              <Link
                href={`/products/${heroDoc.slug}`}
                className="absolute -bottom-5 -left-4 max-w-[13rem] rounded-2xl bg-card px-4 py-3 shadow-[0_16px_36px_-16px_rgba(28,46,27,0.4)] transition-transform hover:-translate-y-0.5 md:-left-10"
              >
                <p className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  New in
                </p>
                <p className="mt-1 truncate font-display text-sm font-bold text-forest-deep uppercase">
                  {heroDoc.name}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gold-deep tabular-nums">
                  {formatPaise(heroDoc.price)}
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <div className="reveal pb-16 md:pb-24">
          <ProductRail
            title={
              <SectionTitle lead="Our" accent="Bloomwell" tail="collection" />
            }
            products={products}
            href="/products"
            linkLabel="See all"
          />
        </div>
      )}

      {/* The story: a tilted photo card with the turning badge, and a few
          lines on what the shop is about. */}
      <section className="reveal grid items-center gap-14 pb-16 md:grid-cols-2 md:gap-16 md:pb-24">
        <div className="relative mx-auto w-full max-w-sm md:max-w-md">
          {/* Leaves reaching out from behind the card, as in a product shot. */}
          <LeafSprig className="absolute -top-10 -left-8 h-40 -rotate-[35deg] text-forest/70 md:-left-14 md:h-52" />
          <LeafSprig className="absolute -right-8 bottom-24 h-32 rotate-[125deg] text-forest/50" />
          <div className="absolute inset-0 -rotate-3 rounded-[2rem] bg-blush-deep/70" />
          <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] bg-blush">
            {storyImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storyImage}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center">
                <Image
                  src={logoMark}
                  alt=""
                  className="h-2/5 w-auto opacity-90"
                />
              </div>
            )}
          </div>
          <RotatingBadge className="absolute -right-4 -bottom-8 md:-right-10" />
        </div>

        {/* isolate + -z-10 keeps the bloom behind the heading. */}
        <div className="relative isolate">
          <Bloom className="absolute -top-16 right-0 -z-10 size-20 animate-float text-gold/30 motion-reduce:animate-none md:-top-20 md:size-28" />
          <SectionTitle lead="Clean that feels" accent="kind," tail="every day" />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Bloomwell is soap and shampoo for the everyday: gentle enough for
            daily use, pleasant enough to look forward to. Find a bar for your
            skin, a bottle for your hair, and have them brought to your door.
          </p>
          <PillLink href="/products" className="mt-8">
            Explore the shop
          </PillLink>
        </div>
      </section>

      {/* Why buy here, on a sage panel so the page ends on something calm. */}
      <section className="reveal relative overflow-hidden rounded-[2rem] bg-forest-soft px-5 py-10 md:px-12 md:py-14">
        {/* Faint flowers in the corners of the panel. */}
        <Bloom
          outline
          className="absolute -top-12 -left-12 size-48 animate-spin-slower text-forest/15 motion-reduce:animate-none"
        />
        <Daisy
          outline
          className="absolute -right-14 -bottom-14 size-56 animate-spin-slower text-forest/15 [animation-direction:reverse] motion-reduce:animate-none"
        />
        <SectionTitle
          lead="Why"
          accent="Bloomwell"
          className="relative text-center"
        />
        <ul className="relative mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
          {[
            {
              icon: Wallet,
              title: "Cash on delivery",
              text: "Pay when your order reaches you. No card needed.",
            },
            {
              icon: Truck,
              title: `Free above ${formatPaise(FREE_DELIVERY_OVER)}`,
              text: `Free delivery on bigger orders, a flat ${formatPaise(DELIVERY_FEE)} below that.`,
            },
            {
              icon: MessageCircle,
              title: "Talk to a real person",
              text: "Every order is confirmed with you on WhatsApp, and we're a message away for any question.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group flex items-start gap-4 rounded-2xl bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(28,46,27,0.35)] md:flex-col md:p-7"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-forest-deep uppercase">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {products.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          The shop is being set up. Please check back shortly.
        </p>
      )}
    </>
  );
}
