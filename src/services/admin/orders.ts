import { http } from "../http";

export type AdminOrderRow = {
  publicId: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
};

export type OrderFilter = OrderStatus | "all";

export const listOrders = (status: OrderFilter = "pending", page = 1) =>
  http.get<{
    orders: AdminOrderRow[];
    total: number;
    pendingCount: number;
    page: number;
    hasMore: boolean;
  }>(`/api/admin/orders?status=${status}&page=${page}`);

export const acceptOrder = (publicId: string) =>
  http.post<{ publicId: string; status: OrderStatus; acceptedAt: string }>(
    `/api/admin/orders/${publicId}/accept`,
  );

export const rejectOrder = (publicId: string) =>
  http.post<{ publicId: string; status: OrderStatus }>(
    `/api/admin/orders/${publicId}/reject`,
  );
