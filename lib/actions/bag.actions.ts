"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { placeOrdersWithStock } from "@/lib/stock";
import type { ProductCardData } from "@/lib/storefront";
import { bagSchema, slugListSchema } from "@/lib/validations/checkout";
import { ProductModel } from "@/models/Product";

export type QuotedLine = {
  productId: string;
  size: string;
  quantity: number;
  // Live data (null = product deleted)
  slug: string | null;
  name: string | null;
  image: string | null;
  unitPrice: number | null; // paise
  stock: number; // units left in this size (0 if size removed)
};

type BagInput = { productId: string; size: string; quantity: number }[];

/** Live prices + stock for the bag page. The browser's copy is only a display snapshot. */
export async function quoteBag(input: BagInput): Promise<{ ok: true; lines: QuotedLine[] } | { ok: false; message: string }> {
  const parsed = bagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid bag" };
  await connectDB();
  const products = await ProductModel.find({ _id: { $in: parsed.data.map((l) => l.productId) } }, { slug: 1, name: 1, price: 1, images: { $slice: 1 }, sizes: 1 }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  return {
    ok: true,
    lines: parsed.data.map((l) => {
      const p = byId.get(l.productId);
      return {
        ...l,
        slug: p?.slug ?? null,
        name: p?.name ?? null,
        image: p?.images[0]?.url ?? null,
        unitPrice: p?.price ?? null,
        stock: p?.sizes.find((s) => s.size === l.size)?.stock ?? 0,
      };
    }),
  };
}

export type BagCheckoutResult = { ok: true; orders: number } | { ok: false; message: string; productId?: string; size?: string };

/** Cash-on-delivery checkout of the whole bag: all lines or nothing (lib/stock.ts transaction). */
export async function placeBagOrder(input: BagInput): Promise<BagCheckoutResult> {
  const user = await getCurrentUser(); // DB-checked
  if (!user) return { ok: false, message: "Please log in to place your order" };
  if (!rateLimit(`place-order:${user.userId}`, 5, 60_000).ok) {
    return { ok: false, message: "Too many orders in a minute. Please wait and try again." };
  }

  const parsed = bagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid bag" };
  const lines = parsed.data;

  await connectDB();
  const products = await ProductModel.find({ _id: { $in: lines.map((l) => l.productId) } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  for (const l of lines) {
    const p = byId.get(l.productId);
    if (!p) return { ok: false, message: "An item in your bag is no longer available", productId: l.productId, size: l.size };
    if (!p.sizes.some((s) => s.size === l.size)) return { ok: false, message: `${p.name} no longer comes in ${l.size}`, productId: l.productId, size: l.size };
  }

  const shipping = { name: user.name, address: user.address ?? undefined, district: user.district ?? undefined, country: user.country ?? "India" };
  const result = await placeOrdersWithStock(
    lines.map((l) => {
      const p = byId.get(l.productId)!;
      return {
        user: user.userId,
        product: String(p._id),
        productName: p.name,
        productImage: p.images[0]?.url,
        category: p.category,
        shipping,
        size: l.size,
        quantity: l.quantity,
        amount: p.price * l.quantity, // prices always from the DB
      };
    }),
  );
  if (!result.ok) {
    const l = lines[result.failedIndex];
    const p = byId.get(l.productId)!;
    return { ok: false, message: `${p.name} (${l.size}) doesn't have ${l.quantity} left. Nothing was ordered.`, productId: l.productId, size: l.size };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, orders: result.orderIds.length };
}

/** Fresh card data for the wishlist page (saved items may have changed price/stock or been deleted). */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  const parsed = slugListSchema.safeParse(slugs);
  if (!parsed.success || parsed.data.length === 0) return [];
  await connectDB();
  const products = await ProductModel.find({ slug: { $in: parsed.data } }, { slug: 1, name: 1, price: 1, images: { $slice: 2 }, sizes: 1 }).lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return parsed.data.flatMap((s) => {
    const p = bySlug.get(s);
    return p ? [{ id: String(p._id), slug: p.slug, name: p.name, price: p.price, images: p.images.map((i) => i.url), sizes: p.sizes.map((z) => ({ size: z.size, stock: z.stock })) }] : [];
  });
}
