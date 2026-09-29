import "@/lib/db";
import { Schema, model, models, type Model } from "mongoose";

const CartItemSchema = new Schema<CartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const CartSchema = new Schema<CartDoc>(
  {
    // One cart per user, enforced by the index rather than by app logic.
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Quantities only — no prices. Price is read live from Product so a cart
    // can never show a stale amount; it's frozen into Order at checkout.
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart = (models.Cart ??
  model<CartDoc>("Cart", CartSchema)) as Model<CartDoc>;
