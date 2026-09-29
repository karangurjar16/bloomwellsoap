"use client";

import { ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { logout } from "@/services/auth";

type AdminHeaderProps = {
  /** Shown when set, replacing the logo — for a nested page like an edit form. */
  backTo?: string;
};

/** Shared by the phone header and the desktop sidebar. */
export function useSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await logout();
    router.replace("/login");
    // The (auth) layout reads the session on the server, so it needs a refresh.
    router.refresh();
  }

  return { signOut, busy };
}

/** Phone and tablet only; desktop has the sidebar instead. */
export function AdminHeader({ backTo }: AdminHeaderProps) {
  const { signOut, busy } = useSignOut();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
        {backTo ? (
          <Link
            href={backTo}
            className="-ml-2 flex items-center gap-1 py-2 pr-2 pl-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back
          </Link>
        ) : (
          <>
            <BrandMark size="sm" wordmark={false} />
            <span className="ml-2.5 rounded-full bg-forest px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-cream uppercase">
              Admin
            </span>
          </>
        )}

        <button
          type="button"
          onClick={() => void signOut()}
          disabled={busy}
          aria-label="Sign out"
          className="ml-auto grid size-10 place-items-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    </header>
  );
}
