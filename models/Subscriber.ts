import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// Newsletter sign-ups from the pre-footer. Unique email = idempotent re-subscribes.
const subscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "footer" },
  },
  { timestamps: true },
);

export type Subscriber = InferSchemaType<typeof subscriberSchema>;

export const SubscriberModel: Model<Subscriber> =
  (models.Subscriber as Model<Subscriber>) ?? model<Subscriber>("Subscriber", subscriberSchema);
