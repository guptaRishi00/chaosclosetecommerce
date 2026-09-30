import { connectDB } from "@/lib/db";
import { OrderModel } from "@/models/Order";

/** Prefill for the checkout delivery form. Every field is a plain string (empty = ask the customer). */
export type DeliveryDefaults = { name: string; house: string; area: string; landmark: string; district: string; phone: string };

/**
 * Phone comes from the account (signup) when it has one; everything else, and the phone as a
 * fallback, from the customer's most recent order, so a returning customer only has to confirm.
 * District falls back to the profile.
 */
export async function getDeliveryDefaults(user: { userId: string; name: string; district?: string | null; phone?: string | null }): Promise<DeliveryDefaults> {
  await connectDB();
  const last = await OrderModel.findOne({ user: user.userId, "shipping.area": { $exists: true } }, { shipping: 1 })
    .sort({ createdAt: -1 })
    .lean();
  const s = last?.shipping;
  return {
    name: user.name,
    house: s?.house ?? "",
    area: s?.area ?? "",
    landmark: s?.landmark ?? "",
    district: s?.district ?? user.district ?? "",
    phone: user.phone ?? s?.phone ?? "",
  };
}
