import "@/lib/db";
import { Schema, model, models, type Model } from "mongoose";

// Same shape as a product image, so one storage driver serves both.
const CategoryImageSchema = new Schema<ImageRef>(
  {
    path: { type: String, required: true },
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

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    emoji: { type: String, trim: true },
    // The category logo. Null is meaningful: it means "fall back to the emoji".
    image: { type: CategoryImageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    // Hides the tab without touching its products.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.index({ sortOrder: 1, isActive: 1 });

export const Category = (models.Category ??
  model<CategoryDoc>("Category", CategorySchema)) as Model<CategoryDoc>;
