import { z } from "zod";

// Shared by client forms and server. Size, MIME type AND extension are all checked;
// lib/cloudinary.ts additionally sniffs the file's magic bytes server-side, since
// the browser-reported MIME type is client-controlled.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // keep below serverActions.bodySizeLimit in next.config.ts

export const IMAGE_TYPES: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export const imageFileSchema = z
  .instanceof(File, { message: "Choose an image" })
  .refine((f) => f.size > 0, "The file is empty")
  .refine((f) => f.size <= MAX_IMAGE_BYTES, "Image must be 5 MB or smaller")
  .refine((f) => f.type in IMAGE_TYPES, "Use a JPEG, PNG or WebP image")
  .refine((f) => {
    const ext = (f.name ?? "").split(".").pop()?.toLowerCase();
    return Boolean(ext && IMAGE_TYPES[f.type]?.includes(ext));
  }, "File extension doesn't match its type");

/**
 * For optional <input type="file">. An untouched input arrives differently per side:
 * a nameless 0-byte File in the browser, but after the Server Action multipart
 * round-trip it can be a 0-byte File with a placeholder name, or the string "".
 * Any empty value means "no file" — an empty file is never a valid image anyway.
 */
export const optionalImageSchema = z.preprocess(
  (v) => (v === "" || v == null || (v instanceof File && v.size === 0) ? undefined : v),
  imageFileSchema.optional(),
);
