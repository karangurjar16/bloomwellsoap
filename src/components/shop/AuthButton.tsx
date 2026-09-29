"use client";

import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { logout } from "@/services/auth";

/**
 * Signed out: a small "Sign in" pill, the header's one call to action.
 * Signed in: a quiet sign-out button.
 *
 * The signed-in flag comes from the server layout rather than a fetch, so the
 * header renders correctly on first paint instead of flickering from "Login"
 * to "sign out" once a request lands.
 */
export function AuthButton({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="group ml-1 flex h-10 items-center gap-2 rounded-full bg-forest pr-1 pl-4 text-[10px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-forest-deep"
      >
        Sign in
        <span className="grid size-8 place-items-center rounded-full bg-cream text-gold-deep">
          <ArrowUpRight
            className="size-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
            aria-hidden
          />
        </span>
      </Link>
    );
  }

  async function signOut() {
    setBusy(true);
    const result = await logout();

    if (!result.ok) {
      toast.error(result.error);
      setBusy(false);
      return;
    }

    toast.success("Signed out");
    // The layout reads the session on the server, so the header only updates
    // after a refresh.
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={busy}
      aria-label="Sign out"
      className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-forest-soft hover:text-forest-deep disabled:opacity-40"
    >
      <LogOut className="size-[17px]" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
