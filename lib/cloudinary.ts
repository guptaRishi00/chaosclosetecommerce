import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/lib/env";

// Server-only (API secret). Uploads arrive as a Web `File` from request.formData() /
// Server Action FormData — no multer needed in the App Router.

let configured = false;

function client() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env();
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/** A user-facing rejection (bad file), as opposed to an infrastructure failure. */
export class UploadError extends Error {}

const MAGIC_BYTES: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

export type UploadedImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
};

/** Call only with a File that already passed imageFileSchema (size is capped there). */
export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!MAGIC_BYTES[file.type]?.(buffer)) {
    throw new UploadError("File content is not a valid JPEG, PNG or WebP image");
  }

  // No retry: a timed-out upload may still have landed; the caller surfaces the failure.
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
        overwrite: false,
        timeout: 30_000,
      },
      (error, res) => (error || !res ? reject(error ?? new Error("Empty Cloudinary response")) : resolve(res)),
    );
    stream.end(buffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await client().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
}
