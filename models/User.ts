import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique index is the enforcement for "one account per email", not a find-then-insert check
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    // Only ever set to "admin" by scripts/seed-admin.mjs — never from a form.
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    // Profile fields. Required at signup by registerSchema, optional here so accounts
    // created before they existed still load and save.
    country: { type: String, default: "India" },
    address: { type: String, trim: true },
    district: { type: String, trim: true },
    age: { type: Number, min: 13, max: 120 },
    gender: { type: String, enum: ["female", "male", "other", "prefer-not-to-say"] },
    avatar: {
      type: new Schema({ url: { type: String, required: true }, publicId: { type: String, required: true } }, { _id: false }),
      required: false,
    },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

// `models.User ??` avoids OverwriteModelError when the module is re-evaluated (dev HMR, serverless).
export const UserModel: Model<User> = (models.User as Model<User>) ?? model<User>("User", userSchema);
