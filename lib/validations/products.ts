import { z } from "zod";
import { CATEGORY_VALUES, MAX_PRODUCT_IMAGES, MAX_PRODUCT_UPLOAD_BYTES, sizesFor } from "@/lib/catalog";
import { imageFileSchema } from "@/lib/validations/uploads";

// Shared by the admin product form (client) and the create/update Server Actions.

const fields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().min(10, "Write at least a short description").max(2000),
  // Rupees in the form; stored as integer paise, which is what Razorpay expects.
  price: z.coerce
    .number({ error: "Enter a price" })
    .positive("Price must be greater than 0")
    .max(10_00_000, "Price must be at most ₹10,00,000")
    .transform((rupees) => Math.round(rupees * 100)),
  category: z.enum(CATEGORY_VALUES, { error: "Choose a category" }),
  sizes: z
    .array(
      z.object({
        size: z.string(),
        stock: z.coerce.number({ error: "Enter a quantity" }).int("Whole numbers only").min(0, "Stock can't be negative").max(100_000),
      }),
    )
    .min(1, "Offer at least one size"),
};

const newImages = z
  .array(imageFileSchema)
  .max(MAX_PRODUCT_IMAGES, `Up to ${MAX_PRODUCT_IMAGES} images`)
  .refine((files) => files.reduce((n, f) => n + f.size, 0) <= MAX_PRODUCT_UPLOAD_BYTES, "New images must total 25 MB or less");

function checkSizes(p: { category: string; sizes: { size: string }[] }, ctx: z.RefinementCtx) {
  const allowed = sizesFor(p.category);
  const seen = new Set<string>();
  for (const { size } of p.sizes) {
    if (!allowed.includes(size)) ctx.addIssue({ code: "custom", path: ["sizes"], message: `${size} isn't a valid size for this category` });
    if (seen.has(size)) ctx.addIssue({ code: "custom", path: ["sizes"], message: `${size} is listed twice` });
    seen.add(size);
  }
}

export const productSchema = z
  .object({ ...fields, images: newImages.min(1, "Add at least one image") })
  .superRefine(checkSizes);

/**
 * Edit: the image list mixes images already on Cloudinary (kept by publicId) with new uploads.
 * `imageOrder` is the final display order as tokens: "e:<publicId>" (existing) or "n:<i>" (i-th new file).
 * The server only honours publicIds that already belong to the product.
 */
export const updateProductSchema = z
  .object({
    ...fields,
    id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid product"),
    keepImages: z.array(z.string().min(1)).max(MAX_PRODUCT_IMAGES),
    images: newImages,
    imageOrder: z.array(z.string().regex(/^(e:.+|n:\d+)$/)),
  })
  .superRefine((p, ctx) => {
    checkSizes(p, ctx);
    const total = p.keepImages.length + p.images.length;
    if (total < 1) ctx.addIssue({ code: "custom", path: ["images"], message: "Keep or add at least one image" });
    if (total > MAX_PRODUCT_IMAGES) ctx.addIssue({ code: "custom", path: ["images"], message: `Up to ${MAX_PRODUCT_IMAGES} images` });
    // The order must name every kept image and every new file exactly once.
    const expected = new Set([...p.keepImages.map((id) => `e:${id}`), ...p.images.map((_, i) => `n:${i}`)]);
    const given = new Set(p.imageOrder);
    if (p.imageOrder.length !== expected.size || given.size !== expected.size || [...expected].some((t) => !given.has(t))) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Image order is out of date — reload the page and try again" });
    }
  });

export type ProductInput = z.input<typeof productSchema>;

/**
 * FormData → schema input. Object.fromEntries would keep only the last image, and
 * sizes are two inputs per row, so both sides of the form use this one mapping:
 *   images   : <input type="file" name="images" multiple>
 *   sizes    : <checkbox name="sizes" value="M">  +  <input name="stock_M">
 */
export function productFormToInput(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category") || undefined,
    // Skip empty entries (untouched input) — see optionalImageSchema for why they vary by side.
    images: formData.getAll("images").filter((v) => v instanceof File && v.size > 0),
    sizes: formData.getAll("sizes").map((size) => ({ size: String(size), stock: formData.get(`stock_${size}`) ?? "" })),
  };
}

/** Edit form adds: id, keepImages (hidden inputs), imageOrder (hidden inputs, display order). */
export function productUpdateFormToInput(formData: FormData) {
  return {
    ...productFormToInput(formData),
    id: formData.get("id"),
    keepImages: formData.getAll("keepImages").map(String),
    imageOrder: formData.getAll("imageOrder").map(String),
  };
}
