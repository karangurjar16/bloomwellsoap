import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";

/**
 * Guards every admin page in one place, so no individual page repeats the
 * check. Built for a phone first: a max-w-md column between a top header and
 * a bottom tab bar. From lg up both give way to a sidebar and the content
 * widens, so lists spread into columns instead of one long strip.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  // A signed-in customer gets the storefront, not a permission error.
  if (session.role !== "admin") redirect("/");

  return (
    // .admin swaps in the panel palette (globals.css); the storefront uses
    // .shop and neither leaks into the other.
    <div className="admin min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      {/* pl-60 clears the fixed sidebar on desktop. */}
      <div className="lg:pl-60">
        <AdminHeader />
        {/* pb-24 clears the fixed bottom tab bar, which desktop doesn't have. */}
        <main className="mx-auto max-w-md px-4 pt-5 pb-24 lg:max-w-6xl lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>
      <AdminNav />
      <Toaster position="top-center" />
    </div>
  );
}
