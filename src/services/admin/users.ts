import { http } from "../http";
import type { AdminOrderRow } from "./orders";

export type AdminUserRow = {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  isActive: boolean;
  addressCount: number;
  orderCount: number;
  /** Paise, accepted orders only. */
  acceptedTotal: number;
  lastOrderAt: string | null;
  createdAt: string;
};

export type AdminUserAddress = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  isDefault: boolean;
};

export type AdminUserDetail = {
  user: {
    id: string;
    name: string;
    mobile: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    addresses: AdminUserAddress[];
  };
  stats: {
    orderCount: number;
    acceptedCount: number;
    pendingCount: number;
    acceptedTotal: number;
  };
  orders: AdminOrderRow[];
};

export function listUsers(options: { q?: string; page?: number } = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  params.set("page", String(options.page ?? 1));

  return http.get<{
    users: AdminUserRow[];
    total: number;
    page: number;
    hasMore: boolean;
  }>(`/api/admin/users?${params.toString()}`);
}

export const getUser = (id: string) =>
  http.get<AdminUserDetail>(`/api/admin/users/${id}`);
