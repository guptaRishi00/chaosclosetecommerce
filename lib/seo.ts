import type { Metadata } from "next";

const PRODUCTION_SITE_URL = "https://chaoscloset.vercel.app";

/** Pick the deployment's own origin unless an explicit canonical origin is configured. */
export function getSiteUrl(): URL {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}/`);
  }
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL_URL) {
    return new URL("http://localhost:3000/");
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured.endsWith("/") ? configured : `${configured}/`);

  if (process.env.NODE_ENV === "production") return new URL(`${PRODUCTION_SITE_URL}/`);
  return new URL(`https://${process.env.VERCEL_URL}/`);
}

export function canonicalUrl(path: string): URL {
  return new URL(path.replace(/^\/+/, ""), getSiteUrl());
}

export function isIndexableDeployment(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
}

export function jsonLd(value: Record<string, unknown>): string {
  // Escaping '<' prevents user-controlled product text from terminating the script element.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
