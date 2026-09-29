import { http } from "../http";

export type ProductImage = {
  /** Storage key, not a URL. */
  path: string;
  provider?: "local" | "cloudinary";
  width: number;
  height: number;
  alt: string;
  /** Resolved by the API for display; not persisted. */
  url?: string;
};

/** Row shape from the admin list. */
export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  stock: number;
  isActive: boolean;
  image: string | null;
};

/** Full document, for the edit form. */
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  isActive: boolean;
  images: ProductImage[];
};

export type ProductInput = {
  name: string;
  description: string;
  tagline: string;
  /** Paise — convert with rupeesToPaise() before calling. */
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  images: ProductImage[];
};

export const listProducts = (page = 1) =>
  http.get<{
    products: AdminProductRow[];
    total: number;
    page: number;
    hasMore: boolean;
  }>(`/api/admin/products?page=${page}`);

export const getProduct = (id: string) =>
  http.get<AdminProduct>(`/api/admin/products/${id}`);

export const createProduct = (input: ProductInput) =>
  http.post<{ id: string; slug: string }>("/api/admin/products", input);

export const updateProduct = (id: string, input: Partial<ProductInput> & { isActive?: boolean }) =>
  http.patch<{ id: string; slug: string }>(`/api/admin/products/${id}`, input);

/** Soft delete — old orders still reference the product's name and image. */
export const hideProduct = (id: string) =>
  http.del<{ hidden: boolean }>(`/api/admin/products/${id}`);
