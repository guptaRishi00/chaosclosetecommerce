"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { rateLimit } from "@/lib/rate-limit";
import { placeOrderWithStock } from "@/lib/stock";
import { placeOrderSchema } from "@/lib/validations/checkout";
import { ProductModel } from "@/models/Product";

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

const ORDERS_PER_MINUTE = 5;

/** Cash-on-delivery order: validate → take stock + create order atomically. No payment step. */
export async function placeOrder(input: { productId: string; size: string; quantity?: number }): Promise<PlaceOrderResult> {
  // DB-checked: a deleted account's still-valid JWT must not be able to order.
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in to place an order" };

  if (!rateLimit(`place-order:${user.userId}`, ORDERS_PER_MINUTE, 60_000).ok) {
    return { ok: false, message: "Too many orders in a minute. Please wait and try again." };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product or size" };
  const { productId, size, quantity } = parsed.data;

  const product = await ProductModel.findById(productId).lean();
  if (!product) return { ok: false, message: "Product not found" };
  if (!product.sizes.some((s) => s.size === size)) return { ok: false, message: "That size isn't available for this product" };

  const result = await placeOrderWithStock({
    user: user.userId,
    product: String(product._id),
    productName: product.name,
    productImage: product.images[0]?.url,
    category: product.category,
    // Snapshot where to deliver: the order must not change if the profile does later.
    shipping: { name: user.name, address: user.address ?? undefined, district: user.district ?? undefined, country: user.country ?? "India" },
    size,
    quantity,
    amount: product.price * quantity, // from the DB, never from the client
  });
  if (!result.ok) {
    const left = product.sizes.find((s) => s.size === size)?.stock ?? 0;
    return { ok: false, message: left > 0 ? `Only ${left} left in ${size}` : `${size} is out of stock` };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/dashboard");
  return { ok: true, orderId: result.orderId };
}
