import Image from "next/image";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import { FulfillmentBadge, PaymentStatus } from "@/components/admin/order-badges";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export type OrderCardData = {
  id: string;
  createdAt: Date;
  productName: string;
  productImage?: string | null;
  size: string;
  quantity: number;
  amount: number;
  status: string;
  fulfillment: string;
  customer?: { name: string; email: string };
};

/**
 * Small-screen stand-in for the orders table: one stacked card per order, so nothing
 * scrolls sideways. Pages show this below their table breakpoint and the table above it.
 */
export function OrderCards({ orders, className }: { orders: OrderCardData[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {orders.map((o) => (
        <li key={o.id} className="relative flex gap-3 p-4 transition-colors hover:bg-accent/40">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {o.productImage && <Image src={o.productImage} alt="" fill sizes="48px" className="object-cover" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              {/* Stretched link: the whole card opens the order */}
              <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm after:absolute after:inset-0 hover:underline">
                #{o.id.slice(-6).toUpperCase()}
              </Link>
              <span className="font-mono text-sm tabular-nums">{formatINR(o.amount)}</span>
            </div>
            <p className="flex min-w-0 items-baseline gap-2 text-sm">
              <span className="truncate">{o.productName}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {o.size} × {o.quantity}
              </span>
            </p>
            {o.customer && (
              <p className="truncate text-xs text-muted-foreground">
                {o.customer.name} · {o.customer.email}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
              <FulfillmentBadge value={o.fulfillment} />
              <PaymentStatus status={o.status} />
              <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground">{dateFmt.format(o.createdAt)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
