import { http } from "../http";

/** Signed-in cart, stored in MongoDB. A 401 means "sign in first". */

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  unit: string;
  image: string | null;
  /** Paise. */
  price: number;
  mrp: number;
  qty: number;
  lineTotal: number;
  stock: number;
};

export type CartView = {
  items: CartLine[];
  subtotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
};

export const getCart = () => http.get<CartView>("/api/cart");

/** Absolute quantity, not a delta — a retried tap must not double the line. */
export const setCartItem = (productId: string, qty: number) =>
  http.post<CartView>("/api/cart", { productId, qty });

export const removeCartItem = (productId: string) =>
  setCartItem(productId, 0);

export const clearCart = () => http.del<CartView>("/api/cart");
