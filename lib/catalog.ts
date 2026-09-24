// Catalogue vocabulary shared by the admin form, validation, model and (later) the storefront.
// Safe to import on client and server.

export const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const BOTTOM_SIZES = ["28", "30", "32", "34", "36", "38", "40"] as const;

export const CATEGORIES = [
  { value: "jeans", label: "Jeans", sizes: BOTTOM_SIZES },
  { value: "linen-pants", label: "Linen pants", sizes: BOTTOM_SIZES },
  { value: "oversized-tshirts", label: "Oversized T-shirts", sizes: TOP_SIZES },
  { value: "tshirts", label: "T-shirts", sizes: TOP_SIZES },
  { value: "shirts", label: "Shirts", sizes: TOP_SIZES },
  { value: "cuban-collar-shirts", label: "Cuban collar shirts", sizes: TOP_SIZES },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
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
