import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexableDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const sitemap = new URL("sitemap.xml", getSiteUrl()).toString();
  if (!isIndexableDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" }, sitemap };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api"] },
    ],
    sitemap,
  };
}
