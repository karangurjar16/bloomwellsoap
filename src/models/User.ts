import "@/lib/db";
import { Schema, model, models, type Model } from "mongoose";
import { USER_ROLES } from "@/lib/constants";

const AddressSchema = new Schema<Address>(
  {
    label: { type: String, default: "Home", trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    landmark: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Bare 10 digits. Always run through normalizeMobile() before writing,
    // or the unique index won't catch +91 / 0-prefixed duplicates.
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/,
    },
    // select: false keeps the hash out of every ordinary query. Login must
    // ask for it explicitly: User.findOne({ mobile }).select("+password")
    password: { type: String, required: true, select: false },
    // Only the seed script sets "admin". Never assign this from a request body.
    role: { type: String, enum: USER_ROLES, default: "customer" },
    addresses: { type: [AddressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = (models.User ??
  model<UserDoc>("User", UserSchema)) as Model<UserDoc>;
