"use client";

import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { useSignOut } from "./AdminHeader";
import { adminTabs, isTabActive } from "./AdminNav";

/**
 * Desktop navigation: a fixed column on the left, in place of the phone's top
 * header and bottom tab bar. A mouse reaches the side of the screen as easily
 * as the top, and a column leaves the full height for content.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, busy } = useSignOut();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-20 items-center gap-2.5 px-6">
        <BrandMark size="sm" wordmark={false} href="/admin" />
        <span className="rounded-full bg-forest px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-cream uppercase">
          Admin
        </span>
      </div>

      <nav className="flex-1 px-3 pt-2">
        <ul className="space-y-1">
          {adminTabs.map(({ href, label, icon: Icon }) => {
            const active = isTabActive(href, pathname);

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                    active
                      ? "bg-forest font-medium text-cream"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon
                    className="size-4.5"
                    strokeWidth={active ? 2 : 1.5}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden />
          View store
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={busy}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
