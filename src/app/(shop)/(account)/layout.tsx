/**
 * Bag, checkout, orders and addresses are single-column lists and forms. The
 * storefront goes full width on desktop, but a form stretched to 1200px is
 * hard to read, so these pages keep a centred reading column. A route group,
 * so the URLs are unchanged.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-2xl">{children}</div>;
}
