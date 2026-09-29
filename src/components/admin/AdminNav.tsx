"use client";

import { LayoutGrid, Package, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Shared by the phone tab bar and the desktop sidebar. */
export const adminTabs = [
  { href: "/admin", label: "Home", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

/** /admin must not light up for /admin/orders, so the root is exact. */
export function isTabActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/**
 * Bottom tab bar: the admin runs this from a phone, and the bottom of the
 * screen is the only part a thumb reaches comfortably. Desktop swaps it for
 * the sidebar.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {adminTabs.map(({ href, label, icon: Icon }) => {
          const active = isTabActive(href, pathname);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 transition-colors",
                  active
                    ? "text-forest"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-forest"
                  />
                )}
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2 : 1.5}
                  aria-hidden
                />
                <span className="text-[9px] font-medium tracking-[0.06em] uppercase">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
