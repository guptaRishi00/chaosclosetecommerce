import { cn, discountPercent, formatINR } from "@/lib/utils";

/**
 * Selling price with an optional cut price: ~~MRP~~ price  N% off. The cut price anchors the
 * real one; the saving is rounded down so it never overstates. Without a (higher) cut price it's
 * just the price. Screen readers hear "Original price ₹X, now ₹Y, N% off".
 */
export function Price({ price, compareAtPrice, size = "sm", className }: { price: number; compareAtPrice?: number | null; size?: "sm" | "lg"; className?: string }) {
  const off = discountPercent(price, compareAtPrice);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums", size === "lg" ? "text-lg sm:text-xl" : "text-sm sm:text-[15px]", className)}>
      {off > 0 && (
        <s className={cn("text-muted-foreground decoration-1", size === "lg" ? "text-base sm:text-lg" : "text-xs sm:text-sm")}>
          <span className="sr-only">Original price </span>
          {formatINR(compareAtPrice!)}
        </s>
      )}
      <span className={cn(size === "lg" ? "font-semibold" : "font-medium text-ink/80", off > 0 && "text-ink")}>
        {off > 0 && <span className="sr-only">now </span>}
        {formatINR(price)}
      </span>
      {off > 0 && <span className={cn("font-semibold text-brand-red", size === "lg" ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>{off}% off</span>}
    </p>
  );
}
