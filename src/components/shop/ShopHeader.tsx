"use client";

import { Package, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { AuthButton } from "./AuthButton";
import { useCartCount } from "./CartCount";

/**
 * Deliberately unlike the admin header: no tools, no status. A shopper gets the
 * name of the shop, a way to search, their bag, and a way in or out. On
 * desktop the main pages sit in the middle as serif links.
 */
export function ShopHeader({ signedIn }: { signedIn: boolean }) {
  const { count } = useCartCount();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    ...(signedIn ? [{ href: "/orders", label: "Orders" }] : []),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center px-5 md:h-20 md:max-w-7xl md:px-8">
        <BrandMark href="/" size="sm" />

        <nav className="mx-auto hidden md:block" aria-label="Main">
          <ul className="flex items-center gap-9">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 font-display text-[13px] font-semibold tracking-[0.12em] uppercase transition-colors",
                      // A honey underline marks where you are.
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-gold after:transition-transform hover:after:scale-x-100",
                      active
                        ? "text-forest-deep after:scale-x-100"
                        : "text-muted-foreground hover:text-forest-deep",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          <Link
            href="/products"
            aria-label="Search products"
            className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-forest-soft hover:text-forest-deep"
          >
            <Search className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </Link>

          {signedIn && (
            <Link
              href="/orders"
              aria-label="Your orders"
              className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-forest-soft hover:text-forest-deep md:hidden"
            >
              <Package className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative grid size-10 place-items-center rounded-full border border-forest/20 text-forest-deep transition-colors hover:border-forest hover:bg-forest-soft"
          >
            <ShoppingBag className="size-[17px]" strokeWidth={1.75} aria-hidden />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid size-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-forest-deep tabular-nums ring-2 ring-background">
                {count}
              </span>
            )}
          </Link>

          <AuthButton signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
