import type { MetadataRoute } from "next";
import { CATEGORY_VALUES } from "@/lib/catalog";
import { getSiteUrl, hasIndexableProductContent, isIndexableDeployment } from "@/lib/seo";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/Product";

// Product records change through the admin without a deployment, so regenerate the sitemap on requests.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = getSiteUrl().toString().replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [{ url: root, changeFrequency: "daily", priority: 1 }];
  if (!isIndexableDeployment()) return entries;

  await connectDB();
  // Product fields are projected and streamed in bounded batches to avoid loading the catalog at once.
  const batchSize = 1000;
  let lastId: unknown;
  const liveCategories = new Set<string>();
  while (true) {
    const filter = lastId ? { _id: { $gt: lastId } } : {};
    const products = await ProductModel.find(filter, { _id: 1, slug: 1, name: 1, description: 1, category: 1, updatedAt: 1 })
      .sort({ _id: 1 })
      .limit(batchSize)
      .lean();
    if (products.length === 0) break;
    for (const product of products) {
      if (!/^[a-z0-9-]{1,120}$/.test(product.slug) || !hasIndexableProductContent(product.name, product.description ?? "")) continue;
      liveCategories.add(product.category);
      entries.push({
        url: `${root}/product/${product.slug}`,
        ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    lastId = products[products.length - 1]._id;
    if (products.length < batchSize) break;
  }
  for (const category of CATEGORY_VALUES) {
    if (liveCategories.has(category)) {
      entries.push({ url: `${root}/shop/${category}`, changeFrequency: "daily", priority: 0.8 });
    }
  }
  return entries;
}
