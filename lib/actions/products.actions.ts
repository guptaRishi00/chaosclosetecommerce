"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { deleteImage, uploadImage, UploadError } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { productFormToInput, productSchema, productUpdateFormToInput, updateProductSchema } from "@/lib/validations/products";
import { fieldErrors, type ActionState } from "@/lib/validations/utils";
import { ProductModel } from "@/models/Product";

const CREATES_PER_MINUTE = 10;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "product"}-${randomBytes(3).toString("hex")}`; // suffix keeps the unique index happy for same-name products
}

// Admin-only create flow: authorize (DB-checked) → validate (same schema as the form) → upload → write → revalidate.
export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "You don't have permission to do that." };

  if (!rateLimit(`product-create:${admin.userId}`, CREATES_PER_MINUTE, 60_000).ok) {
    return { status: "error", message: "Too many products created in a minute. Try again shortly." };
  }

  const parsed = productSchema.safeParse(productFormToInput(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const { images, ...fields } = parsed.data;

  // Upload all images; if any fails, remove the ones that succeeded so nothing is orphaned.
  const results = await Promise.allSettled(images.map((file) => uploadImage(file, `products/${fields.category}`)));
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failure) {
    await cleanup(uploaded);
    if (failure.reason instanceof UploadError) return { status: "error", fieldErrors: { images: [failure.reason.message] } };
    console.error("Product image upload failed", failure.reason);
    return { status: "error", fieldErrors: { images: ["Image upload failed. Please try again."] } };
  }

  await connectDB();
  let slug: string;
  try {
    const product = await ProductModel.create({
      ...fields,
      slug: slugify(fields.name),
      images: uploaded.map(({ url, publicId, width, height }) => ({ url, publicId, width, height })),
      createdBy: admin.userId,
    });
    slug = product.slug;
  } catch (error) {
    await cleanup(uploaded);
    throw error;
  }

  revalidatePath("/admin");
  redirect(`/admin?created=${encodeURIComponent(slug)}`);
}

type StoredImage = { url: string; publicId: string; width?: number | null; height?: number | null };

// Edit flow. Slug is left unchanged so storefront URLs stay stable.
export async function updateProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "You don't have permission to do that." };

  if (!rateLimit(`product-write:${admin.userId}`, CREATES_PER_MINUTE * 2, 60_000).ok) {
    return { status: "error", message: "Too many changes in a minute. Try again shortly." };
  }

  const parsed = updateProductSchema.safeParse(productUpdateFormToInput(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const { id, keepImages, images: newFiles, imageOrder, ...fields } = parsed.data;

  await connectDB();
  const product = await ProductModel.findById(id).lean();
  if (!product) return { status: "error", message: "This product no longer exists." };

  // Only images already on this product can be kept — never trust client-supplied URLs/ids.
  const existing = new Map<string, StoredImage>(product.images.map((img) => [img.publicId, img]));
  if (keepImages.some((pid) => !existing.has(pid))) {
    return { status: "error", fieldErrors: { images: ["Image list is out of date — reload the page and try again."] } };
  }

  const results = await Promise.allSettled(newFiles.map((file) => uploadImage(file, `products/${fields.category}`)));
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failure) {
    await cleanup(uploaded);
    if (failure.reason instanceof UploadError) return { status: "error", fieldErrors: { images: [failure.reason.message] } };
    console.error("Product image upload failed", failure.reason);
    return { status: "error", fieldErrors: { images: ["Image upload failed. Please try again."] } };
  }

  // Schema guarantees imageOrder names each kept id and new index exactly once.
  const finalImages: StoredImage[] = imageOrder.map((token) => {
    if (token.startsWith("e:")) return existing.get(token.slice(2))!;
    const { url, publicId, width, height } = uploaded[Number(token.slice(2))];
    return { url, publicId, width, height };
  });

  let slug: string;
  try {
    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { ...fields, images: finalImages } },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!updated) {
      await cleanup(uploaded);
      return { status: "error", message: "This product was deleted while you were editing it." };
    }
    slug = updated.slug;
  } catch (error) {
    await cleanup(uploaded);
    throw error;
  }

  // Only after the DB points at the new list: delete images the admin removed.
  const removed = product.images.filter((img) => !keepImages.includes(img.publicId));
  await cleanup(removed);

  revalidatePath("/admin");
  redirect(`/admin?updated=${encodeURIComponent(slug)}`);
}

export async function deleteProduct(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { status: "error", message: "You don't have permission to do that." };
  if (!/^[a-f0-9]{24}$/i.test(id)) return { status: "error", message: "Invalid product." };

  if (!rateLimit(`product-write:${admin.userId}`, CREATES_PER_MINUTE * 2, 60_000).ok) {
    return { status: "error", message: "Too many changes in a minute. Try again shortly." };
  }

  await connectDB();
  // Delete the document first: if Cloudinary cleanup then fails we log orphans rather than
  // leave a live product pointing at deleted images. Orders keep their own amount snapshot.
  const product = await ProductModel.findByIdAndDelete(id).lean();
  if (!product) return { status: "error", message: "This product was already deleted." };
  await cleanup(product.images);

  revalidatePath("/admin");
  redirect(`/admin?deleted=${encodeURIComponent(product.name.slice(0, 120))}`);
}

async function cleanup(images: { publicId: string }[]) {
  await Promise.allSettled(images.map((img) => deleteImage(img.publicId)))
    .then((rs) => rs.forEach((r, i) => r.status === "rejected" && console.error("Orphaned image", images[i].publicId, r.reason)));
}
