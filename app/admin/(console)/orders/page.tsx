import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { FULFILLMENT_STATUSES } from "@/lib/orders";
import { connectDB } from "@/lib/db";
import { PAGE_SIZE, pageInfo, parsePage } from "@/lib/pagination";
import { cn, formatINR } from "@/lib/utils";
import { OrderModel } from "@/models/Order";
import "@/models/User"; // registers the model for populate("user")
import { ListPagination } from "@/components/admin/list-pagination";
import { FulfillmentBadge, PaymentStatus } from "@/components/admin/order-badges";
import { OrderCards } from "@/components/admin/order-cards";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Orders" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const FILTERS = [{ value: "all", label: "All" }, ...FULFILLMENT_STATUSES] as const;
type FilterValue = (typeof FILTERS)[number]["value"];

function queryFor(filter: FilterValue) {
  return filter === "all" ? {} : { fulfillment: filter };
}

type PopulatedUser = { name?: string; email?: string } | null;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { status, page: rawPage } = await searchParams;
  const filter: FilterValue = FILTERS.some((f) => f.value === status) ? (status as FilterValue) : "all";

  await connectDB();
  const counts = await Promise.all(FILTERS.map((f) => OrderModel.countDocuments(queryFor(f.value))));
  const info = pageInfo(counts[FILTERS.findIndex((f) => f.value === filter)], parsePage(rawPage));
  const orders = await OrderModel.find(queryFor(filter))
    .sort({ createdAt: -1, _id: -1 })
    .skip(info.skip)
    .limit(PAGE_SIZE)
    .populate("user", "name email")
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Cash on delivery. Stock is taken when an order is placed; marking it delivered records the cash as collected.
        </p>
      </div>

      {/* Vercel-style segmented filter */}
      <nav aria-label="Filter orders" className="flex w-fit flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {FILTERS.map((f, i) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`}
            aria-current={filter === f.value ? "page" : undefined}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors",
              filter === f.value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            <span className="font-mono text-xs text-muted-foreground">{counts[i]}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
            <Receipt className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">{filter === "all" ? "No orders yet" : "No orders here"}</p>
            <p className="text-sm text-muted-foreground">
              {filter === "all" ? "Orders appear here as soon as customers check out." : "Try another filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <OrderCards
            className="lg:hidden"
            orders={orders.map((o) => {
              const user = o.user as unknown as PopulatedUser;
              return {
                id: String(o._id),
                createdAt: o.createdAt,
                productName: o.productName,
                productImage: o.productImage,
                size: o.size,
                quantity: o.quantity,
                amount: o.amount,
                status: o.status,
                fulfillment: o.fulfillment,
                customer: { name: user?.name ?? o.shipping?.name ?? "Deleted user", email: user?.email ?? "Account deleted" },
              };
            })}
          />
          {/* Table needs ~910px; below lg the cards above replace it so nothing scrolls sideways */}
          <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-normal text-muted-foreground">Order</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Item</TableHead>
                <TableHead className="text-right text-xs font-normal text-muted-foreground">Amount</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Payment</TableHead>
                <TableHead className="pr-4 text-xs font-normal text-muted-foreground">Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const user = o.user as unknown as PopulatedUser;
                const id = String(o._id);
                return (
                  <TableRow key={id} className="relative">
                    <TableCell className="py-3 pl-4">
                      {/* Stretched link: whole row opens the order */}
                      <Link href={`/admin/orders/${id}`} className="font-mono text-sm after:absolute after:inset-0 hover:underline">
                        #{id.slice(-6).toUpperCase()}
                      </Link>
                      <div className="text-xs text-muted-foreground">{dateFmt.format(o.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{user?.name ?? o.shipping?.name ?? "Deleted user"}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email ?? "Account deleted"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {o.productImage && <Image src={o.productImage} alt="" fill sizes="36px" className="object-cover" />}
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm">{o.productName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {o.size} × {o.quantity}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatINR(o.amount)}</TableCell>
                    <TableCell>
                      <PaymentStatus status={o.status} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <FulfillmentBadge value={o.fulfillment} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <ListPagination info={info} basePath="/admin/orders" params={{ status: filter === "all" ? undefined : filter }} noun="order" />
    </div>
  );
}
