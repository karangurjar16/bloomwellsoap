import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Bloom, Daisy, LeafSprig } from "./Botanicals";
import { FREE_DELIVERY_OVER } from "@/lib/constants";
import { formatPaise } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Storefront footer. The oversized, barely-there wordmark is the sign-off; the
 * columns under it are the few links a shopper actually looks for down here.
 *
 * A server component, so the WhatsApp number stays in the environment and is
 * only ever rendered into a link.
 */
export function ShopFooter() {
  const chat = whatsappLink("Hi Bloomwell, I have a question.");

  const columns = [
    {
      title: "Shop",
      links: [
        { href: "/products", label: "All products" },
        { href: "/cart", label: "Your bag" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/orders", label: "Your orders" },
        { href: "/addresses", label: "Addresses" },
        { href: "/login", label: "Sign in" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-gradient-to-b from-background to-gold-soft/60">
      {/* Sprigs rising from the bottom corners, as if the page ends in a
          garden bed. */}
      <LeafSprig className="absolute bottom-0 -left-3 h-40 animate-sway text-forest/15 motion-reduce:animate-none md:left-6 md:h-56" />
      <LeafSprig className="absolute -right-3 bottom-0 h-36 -scale-x-100 animate-sway text-forest/15 [animation-delay:-3.5s] motion-reduce:animate-none md:right-6 md:h-52" />

      <div className="relative mx-auto max-w-lg px-5 md:max-w-7xl md:px-8">
        {/* A bloom either side of the wordmark, floating out of step. */}
        <Bloom className="absolute top-8 left-2 size-10 animate-float text-blush-deep motion-reduce:animate-none md:top-16 md:left-10 md:size-16" />
        <Daisy className="absolute top-20 right-3 size-8 animate-float text-gold/40 [animation-delay:-4s] motion-reduce:animate-none md:top-28 md:right-12 md:size-12" />
        <p
          aria-hidden
          className="-mb-[0.18em] pt-10 text-center font-display text-[18vw] leading-none font-bold tracking-tight text-gold/15 select-none md:pt-14 xl:text-[15rem]"
        >
          Bloomwell
        </p>

        <div className="grid gap-10 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-14">
          <div>
            <BrandMark size="sm" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Everyday soaps and shampoos, made to be kind to skin and hair.
              Cash on delivery, free delivery above{" "}
              {formatPaise(FREE_DELIVERY_OVER)}.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="font-display text-sm font-bold tracking-[0.06em] text-forest-deep uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-forest-deep"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {chat && (
            <div>
              <h3 className="font-display text-sm font-bold tracking-[0.06em] text-forest-deep uppercase">
                Help
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a
                    href={chat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-forest-deep"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* On a product page the fixed add-to-bag bar sits over the bottom of
            the screen, so the last line pads itself clear of it. */}
        <p className="border-t border-border/70 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-xs text-muted-foreground [.shop:has([data-cart-bar])_&]:pb-[calc(6rem+env(safe-area-inset-bottom))]">
          © {new Date().getFullYear()} Bloomwell. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
