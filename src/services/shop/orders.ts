import { http } from "../http";

export type PlacedOrder = {
  publicId: string;
  orderNumber: string;
  total: number;
  orderUrl: string;
  /** null when no admin WhatsApp number is configured. */
  waUrl: string | null;
};

export type MyOrder = {
  publicId: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  firstItem: string;
  createdAt: string;
};

/**
 * Places the order. The order is written before WhatsApp opens, so a message
 * the customer never sends still leaves a real order for the admin.
 */
export const placeOrder = (addressId: string) =>
  http.post<PlacedOrder>("/api/orders", { addressId });

export const listMyOrders = () => http.get<MyOrder[]>("/api/orders");
