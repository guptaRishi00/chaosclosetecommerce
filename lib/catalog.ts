// Catalogue vocabulary shared by the admin form, validation, model and (later) the storefront.
// Safe to import on client and server.

export const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const BOTTOM_SIZES = ["28", "30", "32", "34", "36", "38", "40"] as const;

export const CATEGORIES = [
  { value: "jeans", label: "Jeans", description: "Browse the current jeans edit. Each listing shows its photos, price and available waist sizes.", sizes: BOTTOM_SIZES },
  { value: "linen-pants", label: "Linen pants", description: "Explore the linen pants collection and check each listing for photos, price and available waist sizes.", sizes: BOTTOM_SIZES },
  { value: "oversized-tshirts", label: "Oversized T-shirts", description: "Find your fit in the oversized T-shirt edit, with product photos, prices and available sizes shown on each listing.", sizes: TOP_SIZES },
  { value: "tshirts", label: "T-shirts", description: "Browse the current T-shirt selection and see each piece's photos, price and size availability.", sizes: TOP_SIZES },
  { value: "shirts", label: "Shirts", description: "Explore the shirts collection, with photos, prices and available sizes listed for each piece.", sizes: TOP_SIZES },
  { value: "cuban-collar-shirts", label: "Cuban collar shirts", description: "Browse Cuban collar shirts and check each product listing for photos, price and available sizes.", sizes: TOP_SIZES },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categoryDescription(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.description ?? "Browse the current collection and check each listing for product photos, price and available sizes.";
}

export function sizesFor(category: string): readonly string[] {
  return CATEGORIES.find((c) => c.value === category)?.sizes ?? [];
}

export const LOW_STOCK_THRESHOLD = 5;

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_UPLOAD_BYTES = 25 * 1024 * 1024; // total per request; keep < serverActions.bodySizeLimit
