import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow, type PageInfo } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";

type Props = {
  info: PageInfo;
  basePath: string;
  /** Query params to keep on every page link (e.g. a status filter). `page` is added/replaced. */
  params?: Record<string, string | undefined>;
  noun: string; // "product", "order", "account"
};

function hrefFor(basePath: string, params: Props["params"], page: number) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v) q.set(k, v);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/** "Showing 11–20 of 23 products" + Previous · 1 2 3 · Next, using client-side <Link> navigation. */
export function ListPagination({ info, basePath, params, noun }: Props) {
  if (info.total === 0) return null;
  const { page, pages, from, to, total } = info;
  const edge = "h-8 gap-1 px-2.5 text-sm";

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-mono text-foreground">{from}-{to}</span> of{" "}
        <span className="font-mono text-foreground">{total}</span> {noun}
        {total === 1 ? "" : "s"}
      </p>
      {pages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <Link href={hrefFor(basePath, params, page - 1)} aria-label="Previous page" className={cn(buttonVariants({ variant: "ghost" }), edge)}>
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Link>
              ) : (
                <span aria-disabled className={cn(buttonVariants({ variant: "ghost" }), edge, "pointer-events-none opacity-40")}>
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">Previous</span>
                </span>
              )}
            </PaginationItem>
            {pageWindow(page, pages).map((p, i) =>
              p === null ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <Link
                    href={hrefFor(basePath, params, p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(buttonVariants({ variant: p === page ? "outline" : "ghost", size: "icon" }), "font-mono text-sm")}
                  >
                    {p}
                  </Link>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              {page < pages ? (
                <Link href={hrefFor(basePath, params, page + 1)} aria-label="Next page" className={cn(buttonVariants({ variant: "ghost" }), edge)}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span aria-disabled className={cn(buttonVariants({ variant: "ghost" }), edge, "pointer-events-none opacity-40")}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="size-4" />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
