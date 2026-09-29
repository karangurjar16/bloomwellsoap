import type { Types } from "mongoose";

/**
 * Ambient app types. Declared globally so models, route handlers and
 * components can use them without an import.
 *
 * Only types live here — a .d.ts emits no JavaScript, so runtime values
 * (e.g. the ORDER_STATUSES array) belong in src/lib/constants.ts.
 */
declare global {
  // ---------------------------------------------------------------- users

  type UserRole = "customer" | "admin";

  type Address = {
    _id: Types.ObjectId;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    isDefault: boolean;
  };

  type UserDoc = {
    _id: Types.ObjectId;
    name: string;
    mobile: string;
    /** argon2id hash — never the plaintext. */
    password: string;
    role: UserRole;
    addresses: Types.DocumentArray<Address>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  /** A user as it may be sent to the client: no password, plain id. */
  type PublicUser = {
    id: string;
    name: string;
    mobile: string;
    role: UserRole;
  };

  // ------------------------------------------------------------- products

  type ImageRef = {
    /**
     * Storage key, not a URL: a Cloudinary public_id, or a path relative to
     * public/uploads. Resolved through imageUrl() so the delivery domain can
     * change without a data migration.
     */
    path: string;
    /** Which driver holds the file. Absent means local, for older rows. */
    provider?: "local" | "cloudinary";
    width: number;
    height: number;
    alt: string;
  };

  type ProductDoc = {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    tagline: string;
    /** Paise, not rupees. 489000 = ₹4,890. */
    price: number;
    mrp: number;
    unit: string;
    images: ImageRef[];
    stock: number;
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

  // ---------------------------------------------------------------- carts

  type CartItem = {
    productId: Types.ObjectId;
    qty: number;
  };

  type CartDoc = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
  };

  // --------------------------------------------------------------- orders

  type OrderStatus = "pending" | "accepted" | "rejected";

  type OrderItem = {
    productId: Types.ObjectId;
    name: string;
    unit: string;
    image: string;
    /** Paise, frozen at the moment the order was placed. */
    price: number;
    qty: number;
    lineTotal: number;
  };

  type OrderAddress = {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };

  type OrderDoc = {
    _id: Types.ObjectId;
    orderNumber: string;
    publicId: string;
    userId: Types.ObjectId;
    customer: { name: string; mobile: string };
    address: OrderAddress;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: OrderStatus;
    acceptedAt?: Date;
    paymentMode: "cod";
    createdAt: Date;
    updatedAt: Date;
  };

  // ------------------------------------------------------ route contracts

  /** Shape every API route returns, so clients can branch on `ok`. */
  type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; fields?: Record<string, string> };

  type SessionUser = {
    userId: string;
    role: UserRole;
  };
}
