"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { deleteImage, uploadImage, UploadError, type UploadedImage } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { cancelOrderWithStock, restockReturnedOrder } from "@/lib/stock";
import { fulfillmentFormToInput, fulfillmentSchema } from "@/lib/validations/orders";
import { fieldErrors, type ActionState } from "@/lib/validations/utils";
import { OrderModel } from "@/models/Order";

/** Admin: set delivered / not delivered / returned (+ reason, note, optional photo, optional restock) or cancel. */
export async function updateFulfillment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "You don't have permission to do that." };

  if (!rateLimit(`order-write:${admin.userId}`, 30, 60_000).ok) {
    return { status: "error", message: "Too many changes in a minute. Try again shortly." };
  }

  const parsed = fulfillmentSchema.safeParse(fulfillmentFormToInput(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const { id, fulfillment, returnReason, returnDescription, returnImage, restock } = parsed.data;

  await connectDB();
  const order = await OrderModel.findById(id).lean();
  if (!order) return { status: "error", message: "This order no longer exists." };
  if (order.fulfillment === "cancelled") return { status: "error", message: "This order was cancelled and can't be changed." };

  if (fulfillment === "cancelled") {
    if (order.fulfillment !== "not-delivered") {
      return { status: "error", message: "Only orders that haven't been delivered can be cancelled." };
    }
    // Same path as a customer cancel: status flip + restock in one transaction, at most once.
    const res = await cancelOrderWithStock(id, "admin");
    if (!res.ok) return { status: "error", message: "This order changed while you were editing it. Reload and try again." };
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    const note = res.restocked ? ` ${order.quantity} × ${order.size} added back to stock.` : "";
    return { status: "success", message: `Order cancelled.${note}` };
  }

  // Upload outside any DB transaction (network I/O), compensate if the write fails.
  let uploaded: UploadedImage | undefined;
  if (fulfillment === "returned" && returnImage) {
    try {
      uploaded = await uploadImage(returnImage, "returns");
    } catch (error) {
      if (error instanceof UploadError) return { status: "error", fieldErrors: { returnImage: [error.message] } };
      console.error("Return photo upload failed", error);
      return { status: "error", fieldErrors: { returnImage: ["Upload failed. Try again, or save without a photo."] } };
    }
  }

  const set: Record<string, unknown> = { fulfillment };
  if (fulfillment === "delivered") {
    set.deliveredAt = order.deliveredAt ?? new Date();
    // Cash on delivery: delivered means the cash was collected.
    set.status = "paid";
    set.paidAt = order.paidAt ?? new Date();
  }
  if (fulfillment === "returned") {
    set.returnInfo = {
      reason: returnReason,
      description: returnDescription,
      image: uploaded ? { url: uploaded.url, publicId: uploaded.publicId } : order.returnInfo?.image,
      returnedAt: order.returnInfo?.returnedAt ?? new Date(),
      restocked: order.returnInfo?.restocked ?? false, // restock status is owned by restockReturnedOrder
    };
  }
  // Leaving "returned" keeps returnInfo as history; the status is what the UI trusts.

  try {
    // Guarded: the customer may have cancelled since we read the order; cancelled is terminal.
    const res = await OrderModel.updateOne({ _id: id, fulfillment: { $ne: "cancelled" } }, { $set: set });
    if (res.matchedCount === 0) {
      if (uploaded) await deleteImage(uploaded.publicId).catch(() => {});
      return { status: "error", message: "The customer cancelled this order just now. Reload to see it." };
    }
  } catch (error) {
    if (uploaded) await deleteImage(uploaded.publicId).catch(() => {});
    throw error;
  }

  // Replaced return photo: delete the old one only after the DB points at the new one.
  const oldImage = order.returnInfo?.image?.publicId;
  if (uploaded && oldImage) await deleteImage(oldImage).catch((e) => console.error("Orphaned return photo", oldImage, e));

  let restocked = false;
  if (fulfillment === "returned" && restock) restocked = await restockReturnedOrder(id);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin"); // product stock may have changed
  const note = restocked ? ` ${order.quantity} × ${order.size} added back to stock.` : "";
  return { status: "success", message: `Order marked ${fulfillment.replace("-", " ")}.${note}` };
}
