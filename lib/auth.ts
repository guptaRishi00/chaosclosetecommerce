import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

// Edge-safe: imported by middleware.ts, so no Node-only APIs (node:crypto, mongoose) here.
// Password hashing lives in lib/password.ts for that reason.

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds
const ALG = "HS256";

export type Role = "customer" | "admin";
// `role` in the JWT is a routing hint for middleware only. Anything privileged must
// re-check the database via requireAdmin() (lib/admin.ts), so revoking admin is immediate.
export type Session = { userId: string; email: string; role: Role };

function secretKey(): Uint8Array {
  // Read directly rather than via env(): middleware runs on the Edge runtime,
  // where the full server env schema isn't relevant.
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(session: Session): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const key = secretKey(); // outside the try: misconfiguration must throw, not look like "logged out"
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [ALG] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    const role: Role = payload.role === "admin" ? "admin" : "customer"; // tokens from before roles existed → customer
    return { userId: payload.sub, email: payload.email, role };
  } catch {
    return null; // expired, tampered, or malformed
  }
}

export async function setSessionCookie(session: Session): Promise<void> {
  const token = await signToken(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // browsers allow Secure on http://localhost, but not on LAN IPs in dev
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user for Server Components and Server Actions. Deduped per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifyToken(token);
});
