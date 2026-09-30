"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { cancelOrderWithStock, placeOrderWithStock } from "@/lib/stock";
import { deliverySchema, placeOrderSchema, type DeliveryInput } from "@/lib/validations/checkout";
import { fieldErrors, type FieldErrors } from "@/lib/validations/utils";
import { ProductModel } from "@/models/Product";

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string; fieldErrors?: FieldErrors };

const ORDERS_PER_MINUTE = 5;

/** Cash-on-delivery order: validate → take stock + create order atomically. No payment step. */
export async function placeOrder(input: { productId: string; size: string; quantity?: number; delivery: DeliveryInput }): Promise<PlaceOrderResult> {
  // DB-checked: a deleted account's still-valid JWT must not be able to order.
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in to place an order" };

  if (!rateLimit(`place-order:${user.userId}`, ORDERS_PER_MINUTE, 60_000).ok) {
    return { ok: false, message: "Too many orders in a minute. Please wait and try again." };
  }

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product or size" };
  const { productId, size, quantity } = parsed.data;
  const delivery = deliverySchema.safeParse(input.delivery);
  if (!delivery.success) return { ok: false, message: "Check your delivery details", fieldErrors: fieldErrors(delivery.error) };

  await connectDB();
  const product = await ProductModel.findById(productId).lean();
  if (!product) return { ok: false, message: "Product not found" };
  if (!product.sizes.some((s) => s.size === size)) return { ok: false, message: "That size isn't available for this product" };

  const result = await placeOrderWithStock({
    user: user.userId,
    product: String(product._id),
    productName: product.name,
    productImage: product.images[0]?.url,
    category: product.category,
    // Snapshot where to deliver, as entered at checkout: later profile edits don't move a parcel.
    shipping: { name: user.name, ...delivery.data, country: user.country ?? "India" },
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

export type CancelOrderResult = { ok: true } | { ok: false; message: string };

/** Customer cancels their own order while it hasn't been delivered. Units go back to stock. */
export async function cancelMyOrder(orderId: string): Promise<CancelOrderResult> {
  const user = await getCurrentUser(); // DB-checked
  if (!user) return { ok: false, message: "Please log in again to cancel this order" };
  if (!rateLimit(`cancel-order:${user.userId}`, 10, 60_000).ok) {
    return { ok: false, message: "Too many requests. Please wait a moment and try again." };
  }
  if (typeof orderId !== "string" || !/^[a-f0-9]{24}$/i.test(orderId)) return { ok: false, message: "Order not found" };

  await connectDB();
  // Scoped to this customer's own order; the transaction re-checks it's still undelivered.
  const res = await cancelOrderWithStock(orderId, "customer", user.userId);
  if (!res.ok) return { ok: false, message: "This order can't be cancelled any more. It may already be delivered." };

  revalidatePath("/dashboard");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: true };
}
