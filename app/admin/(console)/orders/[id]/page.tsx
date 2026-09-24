import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { returnReasonLabel, type FulfillmentStatus } from "@/lib/orders";
import { formatINR } from "@/lib/utils";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { FulfillmentForm } from "@/components/admin/fulfillment-form";
import { FulfillmentBadge, PaymentStatus } from "@/components/admin/order-badges";

export const metadata: Metadata = { title: "Order" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-border bg-card ${className ?? ""}`}>
      <h2 className="border-b border-border px-5 py-3 text-sm font-semibold">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  await connectDB();
  const order = await OrderModel.findById(id).lean();
  if (!order) notFound();
  const customer = await UserModel.findById(order.user).select("name email").lean();

  const unitPrice = Math.round(order.amount / order.quantity);
  const ret = order.returnInfo;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/admin/orders" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">#{id.slice(-6).toUpperCase()}</h1>
          <PaymentStatus status={order.status} />
          <FulfillmentBadge value={order.fulfillment} />
        </div>
        <p className="text-sm text-muted-foreground">Placed {dateFmt.format(order.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card title="Item">
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {order.productImage && <Image src={order.productImage} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{order.productName}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  Size {order.size} · {order.quantity} × {formatINR(unitPrice)}
                </span>
              </div>
              <span className="font-mono text-lg tabular-nums">{formatINR(order.amount)}</span>
            </div>
          </Card>

          <Card title="Delivery">
            <FulfillmentForm
                initial={{
                  id,
                  fulfillment: order.fulfillment as FulfillmentStatus,
                  returnReason: ret?.reason,
                  returnDescription: ret?.description,
                  returnImageUrl: ret?.image?.url ?? undefined,
                  canRestock: order.stockApplied && !ret?.restocked,
                  alreadyRestocked: Boolean(ret?.restocked),
                  quantity: order.quantity,
                  size: order.size,
                }}
              />
          </Card>

          {ret && order.fulfillment === "returned" && (
            <Card title="Return details">
              <dl>
                <Row label="Reason">{returnReasonLabel(ret.reason)}</Row>
                <Row label="Returned">{dateFmt.format(ret.returnedAt)}</Row>
                <Row label="Back in stock">{ret.restocked ? `Yes — ${order.quantity} × ${order.size}` : "No"}</Row>
              </dl>
              {ret.description && <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{ret.description}</p>}
              {ret.image?.url && (
                <a href={ret.image.url} target="_blank" rel="noreferrer" className="mt-4 block w-fit">
                  <Image src={ret.image.url} alt="Return photo" width={200} height={200} className="rounded-md border border-border object-cover" />
                </a>
              )}
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Customer">
            <dl>
              <Row label="Name">
                {customer ? (
                  <Link href={`/admin/accounts/${String(order.user)}`} className="underline-offset-4 hover:underline">
                    {customer.name}
                  </Link>
                ) : (
                  (order.shipping?.name ?? "—")
                )}
              </Row>
              <Row label="Email">{customer?.email ?? "Account deleted"}</Row>
            </dl>
          </Card>

          {/* Snapshot taken when the order was placed — later profile edits don't move a parcel. */}
          <Card title="Deliver to">
            <dl>
              <Row label="District">{order.shipping?.district || "—"}</Row>
              <Row label="Country">{order.shipping?.country || "India"}</Row>
            </dl>
            {order.shipping?.address && <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{order.shipping.address}</p>}
          </Card>

          <Card title="Payment">
            <dl>
              <Row label="Status">
                <PaymentStatus status={order.status} />
              </Row>
              <Row label="Amount">
                <span className="font-mono">{formatINR(order.amount)}</span>
              </Row>
              <Row label="Method">Cash on delivery</Row>
              {order.deliveredAt && <Row label="Delivered">{dateFmt.format(order.deliveredAt)}</Row>}
              {order.paidAt && <Row label="Cash collected">{dateFmt.format(order.paidAt)}</Row>}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
