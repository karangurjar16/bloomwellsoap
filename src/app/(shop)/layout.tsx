import { GardenBackdrop } from "@/components/shop/Botanicals";
import { CartCountProvider } from "@/components/shop/CartCount";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth";

/**
 * Storefront chrome. Wider column than the admin's max-w-md — a shopping grid
 * needs room to breathe, and this still reads as one column on a phone.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read on the server so the header knows on first paint whether to show
  // Login or sign-out; a client fetch would flicker between the two.
  const session = await getSession();

  return (
    <CartCountProvider>
      {/* .shop swaps in the storefront palette (globals.css). The admin panel
          sits outside it and keeps its monochrome. */}
      <div className="shop min-h-dvh bg-background text-foreground">
        {/* Fixed flowers behind everything; the content after it is
            positioned so it always paints on top. */}
        <GardenBackdrop />
        <ShopHeader signedIn={Boolean(session)} />
        <div className="relative mx-auto max-w-lg px-5 pb-16 md:max-w-7xl md:px-8 md:pb-24">
          {children}
        </div>
        <ShopFooter />
        <Toaster position="top-center" />
      </div>
    </CartCountProvider>
  );
}
