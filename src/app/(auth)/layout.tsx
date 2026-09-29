import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import {
  Bloom,
  Daisy,
  FallingPetals,
  LeafSprig,
} from "@/components/shop/Botanicals";
import { getSession } from "@/lib/auth";
import { FREE_DELIVERY_OVER } from "@/lib/constants";
import { formatPaise } from "@/lib/money";

/**
 * Route group for the signed-out pages. Runs on the server, so an existing
 * session never gets to see the login or register form — it is sent straight
 * to where that role belongs.
 *
 * There is no site header here: this group sits outside (shop), so the form
 * gets the whole viewport and the page doesn't scroll.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "admin" ? "/admin" : "/");

  return (
    // .shop borrows the storefront palette, and the honey wash matches the
    // home page hero, so signing in feels like part of the same shop.
    <main className="shop relative flex min-h-dvh flex-col justify-center overflow-hidden bg-gradient-to-br from-cream via-gold-soft/60 to-blush px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-gold/20 blur-3xl"
      />
      {/* The same garden as the home page hero, around the card. */}
      <FallingPetals fall={1100} />
      <Bloom className="absolute -top-16 -right-16 size-56 animate-spin-slower text-blush-deep/60 motion-reduce:animate-none md:size-72" />
      <Daisy
        outline
        className="absolute -bottom-20 -left-20 size-64 animate-spin-slower text-gold/30 [animation-direction:reverse] motion-reduce:animate-none"
      />
      <LeafSprig className="absolute bottom-0 left-[8%] hidden h-56 animate-sway text-forest/15 motion-reduce:animate-none md:block" />
      <LeafSprig className="absolute right-[10%] bottom-0 hidden h-44 -scale-x-100 animate-sway text-forest/15 [animation-delay:-3s] motion-reduce:animate-none md:block" />
      <div className="relative mx-auto w-full max-w-sm">
        {/* Doubles as the way back to the storefront, since this group has no
            header. Shrinks on short viewports so the form never needs to
            scroll. */}
        <BrandMark
          href="/"
          size="lg"
          className="mb-9 justify-center [@media(max-height:720px)]:mb-6 [@media(max-height:720px)]:[&_img]:h-14"
        />

        {/* A soft white card lifted off the wash — rounded like the rest of
            the shop. */}
        <div className="rounded-[1.75rem] bg-card shadow-[0_30px_60px_-30px_rgba(154,100,18,0.45)]">
          <div className="px-6 py-7 sm:px-8">{children}</div>
        </div>

        <p className="mt-5 text-center text-[10px] tracking-[0.16em] text-muted-foreground uppercase [@media(max-height:800px)]:hidden">
          Cash on delivery · Free delivery above{" "}
          {formatPaise(FREE_DELIVERY_OVER)}
        </p>
      </div>
    </main>
  );
}
