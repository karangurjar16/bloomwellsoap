/**
 * Runtime values that pair with the ambient types in src/types/types.d.ts.
 * A .d.ts emits no JavaScript, so anything a schema or a route needs at
 * runtime (enum lists, defaults) has to live here.
 */

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "rejected",
];

export const USER_ROLES: readonly UserRole[] = ["customer", "admin"];

/** Paise. 4000 = ₹40. */
export const DELIVERY_FEE = 4000;
export const FREE_DELIVERY_OVER = 99900;
