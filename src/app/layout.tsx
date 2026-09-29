import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

// Both self-hosted by next/font, so no render-blocking request to Google.
// Outfit is a soft geometric sans for body text.
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

// Display serif, used for headings only.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bloomwell",
  description: "Gentle soaps and shampoos for everyday care — delivered to your door.",
};

export const viewport: Viewport = {
  themeColor: "#fffaf0",
  // Respects the iPhone notch/home-indicator so env(safe-area-inset-*) works.
  viewportFit: "cover",
};

/**
 * Shell only — fonts, tokens, nothing visual. The storefront chrome (header,
 * cart) lives in the (shop) group, so auth and admin pages don't inherit a
 * header they have no use for.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("font-sans", outfit.variable, playfair.variable)}
    >
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
