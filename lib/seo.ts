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

export function truncateDescription(value: string, maxLength = 160): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const excerpt = text.slice(0, maxLength - 1);
  const wordEnd = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, wordEnd > 0 ? wordEnd : excerpt.length)}…`;
}

export function isIndexableDeployment(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

/** Keep incomplete/test catalog entries available to shoppers while out of search and sitemap. */
export function hasIndexableProductContent(name: string, description: string): boolean {
  const normalizedName = name.trim().toLowerCase();
  const normalizedDescription = description.trim();
  const placeholderNames = new Set(["description", "product", "sample", "sample product", "test", "test product", "untitled"]);
  const wordCount = normalizedDescription.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return !placeholderNames.has(normalizedName) && normalizedDescription.length >= 80 && wordCount >= 12;
}

export function jsonLd(value: Record<string, unknown>): string {
  // Escaping '<' prevents user-controlled product text from terminating the script element.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
