import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { FULFILLMENT_VALUES, PAYMENT_METHOD, PAYMENT_STATUSES, RETURN_REASON_VALUES } from "@/lib/orders";

const returnSchema = new Schema(
  {
    reason: { type: String, enum: RETURN_REASON_VALUES, required: true },
    description: { type: String, default: "" },
    image: { type: new Schema({ url: String, publicId: String }, { _id: false }), required: false },
    returnedAt: { type: Date, required: true },
    restocked: { type: Boolean, default: false }, // units added back to product stock (at most once)
  },
  { _id: false },
);

const shippingSchema = new Schema(
  { name: String, address: String, district: String, country: String },
  { _id: false },
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Snapshots: the order must stay readable if the product/customer is later edited or deleted.
    productName: { type: String, required: true },
    productImage: { type: String },
    category: { type: String, index: true }, // for sales-by-category even if the product is later deleted
    shipping: { type: shippingSchema, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    amount: { type: Number, required: true }, // integer paise = unit price × quantity at order time
    currency: { type: String, required: true, default: "INR" },

    paymentMethod: { type: String, enum: [PAYMENT_METHOD], default: PAYMENT_METHOD },
    status: { type: String, enum: PAYMENT_STATUSES, required: true, default: "pending", index: true }, // payment
    paidAt: { type: Date }, // cash collected

    // Stock is taken when the order is placed, in the same transaction that creates it (lib/stock.ts).
    stockApplied: { type: Boolean, default: false },

    fulfillment: { type: String, enum: FULFILLMENT_VALUES, default: "not-delivered", index: true },
    deliveredAt: { type: Date },
    returnInfo: { type: returnSchema, required: false },
  },
  { timestamps: true },
);

export type Order = InferSchemaType<typeof orderSchema>;

export const OrderModel: Model<Order> = (models.Order as Model<Order>) ?? model<Order>("Order", orderSchema);
