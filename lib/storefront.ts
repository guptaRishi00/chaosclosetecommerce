import { CATEGORIES, CATEGORY_VALUES, type CategoryValue } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { pageInfo } from "@/lib/pagination";
import { ProductModel } from "@/models/Product";

// Server-only catalogue queries for the public storefront. Returns plain, serialisable objects.

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number; // paise
  images: string[]; // first = cover, second = hover image
  sizes: { size: string; stock: number }[];
};

export function isCategory(value: string): value is CategoryValue {
  return (CATEGORY_VALUES as string[]).includes(value);
}

type RawCard = { _id?: unknown; id?: unknown; slug: string; name: string; price: number; images?: { url: string }[]; sizes?: { size: string; stock: number }[] };

function toCard(p: RawCard): ProductCardData {
  return {
    id: String(p._id ?? p.id),
    slug: p.slug,
    name: p.name,
    price: p.price,
    images: (p.images ?? []).slice(0, 2).map((i) => i.url),
    sizes: (p.sizes ?? []).map((s) => ({ size: s.size, stock: s.stock })),
  };
}

const CARD_FIELDS = { slug: 1, name: 1, price: 1, images: { $slice: 2 }, sizes: 1 } as const;

export type CategoryShowcase = {
  value: CategoryValue;
  label: string;
  count: number;
  products: ProductCardData[];
};

/** Home page: every category with its product count and newest 4 products (one aggregation). */
export async function getCategoryShowcase(perCategory = 4): Promise<CategoryShowcase[]> {
  await connectDB();
  const rows = await ProductModel.aggregate<{ _id: string; count: number; items: RawCard[] }>([
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        items: { $firstN: { n: perCategory, input: { id: "$_id", slug: "$slug", name: "$name", price: "$price", images: { $slice: ["$images", 2] }, sizes: "$sizes" } } },
      },
    },
  ]);
  const byCategory = new Map(rows.map((r) => [r._id, r]));
  // Keep the catalogue's category order so the page is stable.
  return CATEGORIES.map((c) => {
    const r = byCategory.get(c.value);
    return { value: c.value, label: c.label, count: r?.count ?? 0, products: (r?.items ?? []).map(toCard) };
  });
}

export const SHOP_PAGE_SIZE = 12;

export async function getCategoryProducts(category: CategoryValue, requestedPage: number) {
  await connectDB();
  const info = pageInfo(await ProductModel.countDocuments({ category }), requestedPage, SHOP_PAGE_SIZE);
  const products = await ProductModel.find({ category }, CARD_FIELDS)
    .sort({ createdAt: -1, _id: -1 })
    .skip(info.skip)
    .limit(SHOP_PAGE_SIZE)
    .lean();
  return { info, products: products.map((p) => toCard(p as unknown as RawCard)) };
}

export type ProductDetail = ProductCardData & { description: string; category: CategoryValue; gallery: string[] };

export async function getProductBySlug(slug: string): Promise<{ product: ProductDetail; related: ProductCardData[] } | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  await connectDB();
  const p = await ProductModel.findOne({ slug }).lean();
  if (!p) return null;
  const related = await ProductModel.find({ category: p.category, _id: { $ne: p._id } }, CARD_FIELDS)
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();
  return {
    product: {
      ...toCard(p as unknown as RawCard),
      id: String(p._id),
      description: p.description ?? "",
      category: p.category as CategoryValue,
      gallery: p.images.map((i) => i.url),
    },
    related: related.map((r) => toCard(r as unknown as RawCard)),
  };
}
