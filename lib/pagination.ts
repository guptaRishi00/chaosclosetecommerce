export const PAGE_SIZE = 10;

/** `?page=` → a positive integer (bad/missing input → 1). Clamp to the real page count with `pageInfo`. */
export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export type PageInfo = { page: number; pages: number; skip: number; total: number; from: number; to: number };

/** Clamps an out-of-range page (e.g. ?page=99, or after deleting the last item on a page) to the last page. */
export function pageInfo(total: number, requested: number, size = PAGE_SIZE): PageInfo {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requested, pages);
  const skip = (page - 1) * size;
  return { page, pages, skip, total, from: total === 0 ? 0 : skip + 1, to: Math.min(skip + size, total) };
}

/** Page numbers to show, with null for an ellipsis: 1 … 4 5 6 … 12 */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}
