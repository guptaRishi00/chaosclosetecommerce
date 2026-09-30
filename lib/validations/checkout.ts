import { z } from "zod";
import { MAX_ORDER_QUANTITY } from "@/lib/orders";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const bagLine = z.object({
  productId: objectId,
  size: z.string().min(1).max(10),
  quantity: z.coerce.number().int().min(1).max(MAX_ORDER_QUANTITY),
});

/** Bag checkout / quote. Duplicate (product, size) lines are merged; quantities re-capped. */
export const bagSchema = z
  .array(bagLine)
  .min(1, "Your bag is empty")
  .max(20, "Up to 20 items per order")
  .transform((lines) => {
    const merged = new Map<string, z.infer<typeof bagLine>>();
    for (const l of lines) {
      const key = `${l.productId}:${l.size}`;
      const cur = merged.get(key);
      merged.set(key, cur ? { ...cur, quantity: Math.min(MAX_ORDER_QUANTITY, cur.quantity + l.quantity) } : l);
    }
    return [...merged.values()];
  });

export const slugListSchema = z.array(z.string().regex(/^[a-z0-9-]{1,120}$/)).max(100);

/** Client → placeOrder Server Action (cash on delivery). Amount is never accepted from the client. */
export const placeOrderSchema = z.object({
  productId: objectId,
  size: z.string().min(1, "Choose a size").max(10),
  quantity: z.coerce.number().int().min(1).max(MAX_ORDER_QUANTITY).default(1),
});

/** Indian mobile number. Accepts +91 / 91 / 0 prefixes, spaces and dashes; stored as the bare 10 digits. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"));

/** Where to deliver an order. Collected at every checkout (Buy now and bag), validated again on the server. */
export const deliverySchema = z.object({
  house: z.string().trim().min(1, "Enter your house or flat number").max(80),
  area: z.string().trim().min(3, "Enter your street, area or locality").max(160),
  landmark: z
    .string()
    .trim()
    .max(120, "Keep the landmark under 120 characters")
    .optional()
    .transform((v) => v || undefined),
  district: z.string().trim().min(2, "Enter your district").max(60),
  phone: phoneSchema,
});

export type DeliveryInput = z.input<typeof deliverySchema>;
export type Delivery = z.output<typeof deliverySchema>;
