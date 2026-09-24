import { stockState, type StockState } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const STYLES: Record<StockState, { label: string; dot: string; text: string }> = {
  "in-stock": { label: "In stock", dot: "bg-success", text: "text-foreground" },
  "low-stock": { label: "Low stock", dot: "bg-warning", text: "text-foreground" },
  "out-of-stock": { label: "Out of stock", dot: "bg-danger", text: "text-muted-foreground" },
};

/** Vercel-style status: a coloured dot + label (like a deployment's "Ready"/"Error"). */
export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  const s = STYLES[stockState(stock)];
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm whitespace-nowrap", s.text, className)}>
      <span aria-hidden className={cn("size-2 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/** Compact per-size chip: struck through and dimmed when that size is out of stock. */
export function SizeChip({ size, stock }: { size: string; stock: number }) {
  const state = stockState(stock);
  return (
    <span
      title={`${size}: ${stock} in stock`}
      className={cn(
        "inline-flex h-6 min-w-8 items-center justify-center rounded-md border px-1.5 font-mono text-[11px]",
        state === "out-of-stock" && "border-border text-muted-foreground/60 line-through",
        state === "low-stock" && "border-warning/40 text-warning",
        state === "in-stock" && "border-border text-foreground",
      )}
    >
      {size}
    </span>
  );
}
