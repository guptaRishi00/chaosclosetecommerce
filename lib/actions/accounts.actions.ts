"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { deleteImage } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/lib/validations/utils";
import { UserModel } from "@/models/User";

/**
 * Admin: permanently delete a customer account. Their orders are kept (they carry product and
 * shipping snapshots) and show the customer as deleted. Admin accounts can't be deleted here,
 * so the console can never lock itself out — manage admins with `bun run seed:admin`.
 * Their session cookie dies with the account: every customer-facing check uses getCurrentUser()
 * (DB-checked), so a still-valid JWT for a deleted account is treated as logged out.
 */
export async function deleteAccount(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "You don't have permission to do that." };
  if (!/^[a-f0-9]{24}$/i.test(id)) return { status: "error", message: "Invalid account." };
  if (id === admin.userId) return { status: "error", message: "You can't delete your own admin account." };

  if (!rateLimit(`account-delete:${admin.userId}`, 20, 60_000).ok) {
    return { status: "error", message: "Too many deletions in a minute. Try again shortly." };
  }

  await connectDB();
  // role guard in the filter itself: an admin account is never matched, even with a crafted id.
  const user = await UserModel.findOneAndDelete({ _id: id, role: { $ne: "admin" } }).lean();
  if (!user) {
    const stillThere = await UserModel.exists({ _id: id });
    return { status: "error", message: stillThere ? "Admin accounts can't be deleted from the console." : "This account was already deleted." };
  }

  // After the DB delete: an orphaned photo is harmless, a live account pointing at a deleted one isn't.
  if (user.avatar?.publicId) {
    await deleteImage(user.avatar.publicId).catch((e) => console.error("Orphaned avatar", user.avatar?.publicId, e));
  }

  revalidatePath("/admin/accounts");
  revalidatePath("/admin/orders");
  redirect(`/admin/accounts?deleted=${encodeURIComponent(user.email)}`);
}
