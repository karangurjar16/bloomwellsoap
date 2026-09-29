import "@/lib/db";
import { Schema, model, models, type Model } from "mongoose";

const ImageSchema = new Schema<ImageRef>(
  {
    // A storage key, not a URL: an absolute URL would break the day the
    // delivery domain or the storage provider changes.
    path: { type: String, required: true },
    // Per image, not global, so images uploaded before a host move keep
    // resolving through the driver that actually holds them.
    provider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
    },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

const ProductSchema = new Schema<ProductDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    description: { type: String, default: "", trim: true },
    tagline: { type: String, default: "", trim: true, maxlength: 120 },
    // Integer paise everywhere. Floats drift by a paisa on multi-item totals
    // and invoices stop reconciling.
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "", trim: true },
    images: { type: [ImageSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    // Soft delete: old orders still reference this product's images.
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Drives the storefront list: active products, newest first.
ProductSchema.index({ isActive: 1, createdAt: -1 });

export const Product = (models.Product ??
  model<ProductDoc>("Product", ProductSchema)) as Model<ProductDoc>;
