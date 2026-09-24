import mongoose from "mongoose";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";

// Stock bookkeeping. Each function runs its writes in one MongoDB transaction (Atlas is a
// replica set), so an order can never exist without its stock being taken, and a restock can
// never apply twice. No network I/O inside the transactions.

export type NewOrder = {
  user: string;
  product: string;
  productName: string;
  productImage?: string;
  category: string;
  shipping: { name: string; address?: string; district?: string; country?: string };
  size: string;
  quantity: number;
  amount: number;
};

export type PlaceResult = { ok: true; orderId: string } | { ok: false; reason: "out-of-stock" };

/**
 * Cash on delivery: take the units and create the order atomically. The decrement is guarded
 * ($elemMatch stock >= quantity), so two customers racing for the last unit can't both win —
 * the loser's transaction writes nothing and gets "out-of-stock".
 */
export async function placeOrderWithStock(input: NewOrder): Promise<PlaceResult> {
  return mongoose.connection.transaction(async (session) => {
    const taken = await ProductModel.updateOne(
      { _id: input.product, sizes: { $elemMatch: { size: input.size, stock: { $gte: input.quantity } } } },
      { $inc: { "sizes.$.stock": -input.quantity } },
      { session },
    );
    if (taken.modifiedCount === 0) return { ok: false, reason: "out-of-stock" } as const;

    const [order] = await OrderModel.create(
      [{ ...input, status: "pending", paymentMethod: "cod", stockApplied: true, fulfillment: "not-delivered" }],
      { session },
    );
    return { ok: true, orderId: order.id as string } as const;
  });
}

export type PlaceManyResult = { ok: true; orderIds: string[] } | { ok: false; failedIndex: number };

/**
 * Bag checkout: every line takes stock and becomes an order inside ONE transaction. If any line
 * can't be filled, the transaction aborts and nothing is written (no half-placed bags).
 */
export async function placeOrdersWithStock(inputs: NewOrder[]): Promise<PlaceManyResult> {
  class OutOfStock extends Error {
    constructor(public index: number) {
      super("out-of-stock");
    }
  }
  try {
    return await mongoose.connection.transaction(async (session) => {
      const ids: string[] = [];
      for (const [i, input] of inputs.entries()) {
        const taken = await ProductModel.updateOne(
          { _id: input.product, sizes: { $elemMatch: { size: input.size, stock: { $gte: input.quantity } } } },
          { $inc: { "sizes.$.stock": -input.quantity } },
          { session },
        );
        if (taken.modifiedCount === 0) throw new OutOfStock(i); // throwing aborts the whole transaction
        const [order] = await OrderModel.create(
          [{ ...input, status: "pending", paymentMethod: "cod", stockApplied: true, fulfillment: "not-delivered" }],
          { session },
        );
        ids.push(order.id as string);
      }
      return { ok: true, orderIds: ids } as const;
    });
  } catch (error) {
    if (error instanceof OutOfStock) return { ok: false, failedIndex: error.index };
    throw error;
  }
}

/**
 * Returned order → put its units back, at most once (guarded by returnInfo.restocked and
 * stockApplied). Returns false if there was nothing to restock (never taken, already restocked,
 * or the product/size no longer exists).
 */
export async function restockReturnedOrder(orderId: string): Promise<boolean> {
  return mongoose.connection.transaction(async (session) => {
    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId, fulfillment: "returned", stockApplied: true, "returnInfo.restocked": { $ne: true } },
      { $set: { "returnInfo.restocked": true } },
      { session, returnDocument: "after" },
    );
    if (!order) return false;
    const res = await ProductModel.updateOne(
      { _id: order.product, "sizes.size": order.size },
      { $inc: { "sizes.$.stock": order.quantity } },
      { session },
    );
    if (res.modifiedCount === 0) {
      // Product or size gone: undo the flag so the UI doesn't claim a restock happened.
      await OrderModel.updateOne({ _id: order._id }, { $set: { "returnInfo.restocked": false } }, { session });
      return false;
    }
    return true;
  });
}
