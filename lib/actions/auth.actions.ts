"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { deleteImage, uploadImage, UploadError, type UploadedImage } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { fieldErrors, type ActionState } from "@/lib/validations/utils";
import { UserModel } from "@/models/User";

const AUTH_ATTEMPTS = 10;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

/** Only same-origin relative paths — blocks open redirects like `?next=//evil.com`. */
function safeRedirect(target: FormDataEntryValue | null): string {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return "/dashboard";
  }
  return target;
}

async function throttled(action: string): Promise<boolean> {
  const ip = clientIp(await headers());
  return !rateLimit(`${action}:${ip}`, AUTH_ATTEMPTS, AUTH_WINDOW_MS).ok;
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (await throttled("register")) {
    return { status: "error", message: "Too many attempts. Try again in a few minutes." };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const { password, avatar, ...profile } = parsed.data;

  // Upload first (register is already rate-limited per IP above); compensate below if the insert fails.
  let uploaded: UploadedImage | undefined;
  if (avatar) {
    try {
      uploaded = await uploadImage(avatar, "avatars");
    } catch (error) {
      if (error instanceof UploadError) return { status: "error", fieldErrors: { avatar: [error.message] } };
      console.error("Avatar upload failed", error);
      return { status: "error", fieldErrors: { avatar: ["Upload failed. Try again, or skip the photo for now."] } };
    }
  }

  await connectDB();

  let userId: string;
  try {
    const user = await UserModel.create({
      ...profile,
      passwordHash: await hashPassword(password),
      avatar: uploaded && { url: uploaded.url, publicId: uploaded.publicId },
    });
    userId = user.id;
  } catch (error) {
    if (uploaded) await deleteImage(uploaded.publicId).catch((e) => console.error("Orphaned avatar", uploaded.publicId, e));
    // The unique index on email is the source of truth; no racy find-then-insert.
    if ((error as { code?: number }).code === 11000) {
      return { status: "error", fieldErrors: { email: ["An account with this email already exists"] } };
    }
    throw error;
  }
  const { email } = profile;

  await setSessionCookie({ userId, email, role: "customer" });
  redirect(safeRedirect(formData.get("next"))); // throws; must stay outside try/catch
}

type AuthResult = { ok: true; userId: string; email: string; role: "customer" | "admin" } | { ok: false; state: ActionState };

/** Shared credential check for customer and admin login. */
async function authenticate(formData: FormData, bucket: string, attempts: number): Promise<AuthResult> {
  if (!rateLimit(`${bucket}:${clientIp(await headers())}`, attempts, AUTH_WINDOW_MS).ok) {
    return { ok: false, state: { status: "error", message: "Too many attempts. Try again in a few minutes." } };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, state: { status: "error", fieldErrors: fieldErrors(parsed.error) } };

  const { email, password } = parsed.data;
  await connectDB();

  // Only "+passwordHash": adding a plain path (e.g. "role") would make the projection inclusive
  // and silently drop email, producing a JWT that verifyToken rejects.
  const user = await UserModel.findOne({ email }).select("+passwordHash");
  // Same message for unknown email and wrong password — don't reveal which accounts exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, state: { status: "error", message: "Invalid email or password" } };
  }
  return { ok: true, userId: user.id, email: user.email, role: user.role === "admin" ? "admin" : "customer" };
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authenticate(formData, "login", AUTH_ATTEMPTS);
  if (!auth.ok) return auth.state;

  await setSessionCookie({ userId: auth.userId, email: auth.email, role: auth.role });
  redirect(safeRedirect(formData.get("next")));
}

const ADMIN_ATTEMPTS = 5;

export async function adminLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authenticate(formData, "admin-login", ADMIN_ATTEMPTS);
  if (!auth.ok) return auth.state;
  // A valid customer login gets the same generic error: don't confirm which accounts are admins.
  if (auth.role !== "admin") return { status: "error", message: "Invalid email or password" };

  await setSessionCookie({ userId: auth.userId, email: auth.email, role: "admin" });
  const next = safeRedirect(formData.get("next"));
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogout(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
