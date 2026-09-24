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
