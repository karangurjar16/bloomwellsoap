"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCart } from "@/services/shop/cart";

/**
 * Item count for the header badge, shared so that adding to the cart on a
 * product page updates the badge without a page reload.
 *
 * A signed-out visitor gets 0: /api/cart answers 401, which is expected here
 * rather than an error to report.
 */
type CartCountValue = {
  count: number;
  refresh: () => Promise<void>;
  /** Optimistic bump, so the badge moves on tap instead of after the request. */
  bump: (by: number) => void;
};

const CartCountContext = createContext<CartCountValue>({
  count: 0,
  refresh: async () => {},
  bump: () => {},
});

export function CartCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const result = await getCart();
    if (!result.ok) {
      setCount(0);
      return;
    }
    setCount(result.data.items.reduce((sum, item) => sum + item.qty, 0));
  }, []);

  const bump = useCallback((by: number) => {
    setCount((current) => Math.max(0, current + by));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <CartCountContext.Provider value={{ count, refresh, bump }}>
      {children}
    </CartCountContext.Provider>
  );
}

export const useCartCount = () => useContext(CartCountContext);
