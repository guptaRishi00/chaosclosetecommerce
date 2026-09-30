"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImage, uploadImage, UploadError, type UploadedImage } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { profileSchema } from "@/lib/validations/auth";
import { fieldErrors, type ActionState } from "@/lib/validations/utils";
import { UserModel } from "@/models/User";

/** Customer updates their own profile (never someone else's: the id comes from the session only). */
export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser(); // DB-checked
  if (!user) return { status: "error", message: "Please log in again to update your profile." };
  if (!rateLimit(`profile-update:${user.userId}`, 10, 60_000).ok) {
    return { status: "error", message: "Too many changes in a minute. Try again shortly." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const { avatar, removeAvatar, phone, ...fields } = parsed.data;

  await connectDB();
  const current = await UserModel.findById(user.userId).select("avatar").lean();
  if (!current) return { status: "error", message: "Your account no longer exists." };

  // Upload before the write (network I/O), remove it again if the write fails.
  let uploaded: UploadedImage | undefined;
  if (avatar) {
    try {
      uploaded = await uploadImage(avatar, "avatars");
    } catch (error) {
      if (error instanceof UploadError) return { status: "error", fieldErrors: { avatar: [error.message] } };
      console.error("Avatar upload failed", error);
      return { status: "error", fieldErrors: { avatar: ["Upload failed. Try again, or save without a new photo."] } };
    }
  }

  const set: Record<string, unknown> = { ...fields };
  const unset: Record<string, 1> = {};
  if (phone) set.phone = phone;
  else unset.phone = 1; // emptied field removes the number
  if (uploaded) set.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  else if (removeAvatar) unset.avatar = 1;

  try {
    await UserModel.updateOne({ _id: user.userId }, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { runValidators: true });
  } catch (error) {
    if (uploaded) await deleteImage(uploaded.publicId).catch(() => {});
    throw error;
  }

  // Old photo is deleted only once the account points at the new one (or at none).
  const old = current.avatar?.publicId;
  if (old && (uploaded || removeAvatar)) await deleteImage(old).catch((e) => console.error("Orphaned avatar", old, e));

  revalidatePath("/dashboard");
  redirect("/dashboard?profile=saved"); // throws; must stay outside try/catch
}
