import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Baseline CSP. Payments are cash on delivery, so no third-party checkout origins are allowed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", // blob: = local previews of files picked for upload
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Default is 1 MB. Largest action is admin product create: up to 6 images, 25 MB total
    // (lib/catalog.ts MAX_PRODUCT_UPLOAD_BYTES), plus form fields. Direct browser→Cloudinary
    // signed uploads would let this drop back to a few MB.
    serverActions: { bodySizeLimit: "26mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, // placeholder hero photos; remove once replaced
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
