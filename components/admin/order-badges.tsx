import { fulfillmentLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";

// Cash on delivery: "pending" until the order is marked delivered (cash collected).
const PAYMENT: Record<string, { label: string; dot: string }> = {
  pending: { label: "COD · To collect", dot: "bg-warning" },
  paid: { label: "COD · Collected", dot: "bg-success" },
};

export function PaymentStatus({ status }: { status: string }) {
  const s = PAYMENT[status] ?? { label: status, dot: "bg-muted-foreground" };
  return (
    <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
      <span aria-hidden className={cn("size-2 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

const FULFILLMENT_STYLE: Record<string, string> = {
  "not-delivered": "border-border text-muted-foreground",
  delivered: "border-success/40 bg-success/10 text-success",
  returned: "border-warning/40 bg-warning/10 text-warning",
};

export function FulfillmentBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        FULFILLMENT_STYLE[value] ?? "border-border",
      )}
    >
      {fulfillmentLabel(value)}
    </span>
  );
}
