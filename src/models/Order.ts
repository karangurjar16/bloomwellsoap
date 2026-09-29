import "@/lib/db";
import { Schema, model, models, type Model } from "mongoose";
import { ORDER_STATUSES } from "@/lib/constants";
import { newOrderNumber, newPublicId } from "@/lib/ids";

// Every item field is a copy, not a lookup. Editing or deleting a product
// must never rewrite an order that was already placed.
const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    unit: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderAddressSchema = new Schema<OrderAddress>(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    landmark: { type: String },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDoc>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => newOrderNumber(),
    },
    // The shared /order/<publicId> URL. Random rather than the ObjectId,
    // which is enumerable.
    publicId: {
      type: String,
      required: true,
      unique: true,
      default: () => newPublicId(),
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshots: the user may rename themselves or edit the address later,
    // but the order must still record where it actually went.
    customer: {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
    },
    address: { type: OrderAddressSchema, required: true },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    // Paise. Computed server-side from Product prices, never from the client.
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    acceptedAt: { type: Date },
    paymentMode: { type: String, enum: ["cod"], default: "cod" },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 }); // "my orders"
OrderSchema.index({ status: 1, createdAt: -1 }); // admin queue

export const Order = (models.Order ??
  model<OrderDoc>("Order", OrderSchema)) as Model<OrderDoc>;
