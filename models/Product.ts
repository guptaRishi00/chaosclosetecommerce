import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { CATEGORY_VALUES } from "@/lib/catalog";

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
  },
  { _id: false },
);

const sizeSchema = new Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 }, // 0 = out of stock for this size
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true }, // for storefront URLs
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 }, // integer paise
    category: { type: String, required: true, enum: CATEGORY_VALUES, index: true },
    images: { type: [imageSchema], default: [] }, // first image is the cover
    sizes: { type: [sizeSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type Product = InferSchemaType<typeof productSchema>;

export const ProductModel: Model<Product> =
  (models.Product as Model<Product>) ?? model<Product>("Product", productSchema);
