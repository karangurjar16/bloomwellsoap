import { http } from "../http";

/** Public catalogue reads. No auth — browsing never needs a session. */

export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  /** Paise. Format with formatPaise(). */
  price: number;
  mrp: number;
  unit: string;
  image: string | null;
  inStock: boolean;
};

export function listProducts(options: {
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  params.set("page", String(options.page ?? 1));
  if (options.limit) params.set("limit", String(options.limit));

  return http.get<{
    products: ShopProduct[];
    total: number;
    page: number;
    hasMore: boolean;
  }>(`/api/products?${params.toString()}`);
}
