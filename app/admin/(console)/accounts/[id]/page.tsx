import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { PAGE_SIZE, pageInfo, parsePage } from "@/lib/pagination";
import { GENDERS } from "@/lib/validations/auth";
import { formatINR } from "@/lib/utils";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { AccountDangerZone } from "@/components/admin/account-danger-zone";
import { ListPagination } from "@/components/admin/list-pagination";
import { FulfillmentBadge, PaymentStatus } from "@/components/admin/order-badges";
import { OrderCards } from "@/components/admin/order-cards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Account" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function AdminAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ id }, { page: rawPage }] = await Promise.all([params, searchParams]);
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  const me = (await requireAdmin())!; // console layout already redirected non-admins

  await connectDB();
  const user = await UserModel.findById(id).lean();
  if (!user) notFound();

  // Lifetime summary across all of this customer's orders (not just the visible page).
  const [summary] = await OrderModel.aggregate<{ orders: number; net: number; collected: number; toCollect: number; returned: number }>([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        net: { $sum: { $cond: [{ $ne: ["$fulfillment", "returned"] }, "$amount", 0] } },
        collected: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
        toCollect: { $sum: { $cond: [{ $eq: ["$fulfillment", "not-delivered"] }, "$amount", 0] } },
        returned: { $sum: { $cond: [{ $eq: ["$fulfillment", "returned"] }, 1, 0] } },
      },
    },
  ]);
  const s = summary ?? { orders: 0, net: 0, collected: 0, toCollect: 0, returned: 0 };
  const info = pageInfo(s.orders, parsePage(rawPage));
  const orders = await OrderModel.find({ user: user._id }).sort({ createdAt: -1, _id: -1 }).skip(info.skip).limit(PAGE_SIZE).lean();

  const isAdmin = user.role === "admin";
  const gender = GENDERS.find((g) => g.value === user.gender)?.label;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href="/admin/accounts" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Accounts
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-14 border border-border">
            {user.avatar?.url && <AvatarImage src={user.avatar.url} alt="" className="object-cover" />}
            <AvatarFallback className="bg-muted text-lg">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
              <span
                className={
                  isAdmin
                    ? "inline-flex h-6 items-center rounded-full border border-[#52a8ff]/40 bg-[#52a8ff]/10 px-2.5 text-xs font-medium text-[#52a8ff]"
                    : "inline-flex h-6 items-center rounded-full border border-border px-2.5 text-xs text-muted-foreground"
                }
              >
                {isAdmin ? "Admin" : "Customer"}
              </span>
              {String(user._id) === me.userId && <span className="text-xs text-muted-foreground">(you)</span>}
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders" value={String(s.orders)} />
        <Stat label="Net spent" value={formatINR(s.net)} />
        <Stat label="Cash to collect" value={formatINR(s.toCollect)} />
        <Stat label="Returned" value={String(s.returned)} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <h2 className="text-base font-semibold">Orders</h2>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
              <ShoppingBag className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No orders from this account yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <OrderCards
                className="xl:hidden"
                orders={orders.map((o) => ({
                  id: String(o._id),
                  createdAt: o.createdAt,
                  productName: o.productName,
                  productImage: o.productImage,
                  size: o.size,
                  quantity: o.quantity,
                  amount: o.amount,
                  status: o.status,
                  fulfillment: o.fulfillment,
                }))}
              />
              {/* Table needs ~740px and sits in a 2/3 column from lg, so it only fits from xl */}
              <div className="hidden xl:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs font-normal text-muted-foreground">Order</TableHead>
                    <TableHead className="text-xs font-normal text-muted-foreground">Item</TableHead>
                    <TableHead className="text-right text-xs font-normal text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs font-normal text-muted-foreground">Payment</TableHead>
                    <TableHead className="pr-4 text-xs font-normal text-muted-foreground">Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const oid = String(o._id);
                    return (
                      <TableRow key={oid} className="relative">
                        <TableCell className="py-3 pl-4">
                          {/* Stretched link: the whole row opens the order page */}
                          <Link href={`/admin/orders/${oid}`} className="font-mono text-sm after:absolute after:inset-0 hover:underline">
                            #{oid.slice(-6).toUpperCase()}
                          </Link>
                          <div className="text-xs text-muted-foreground">{dateTimeFmt.format(o.createdAt)}</div>
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
          <ListPagination info={info} basePath={`/admin/accounts/${id}`} noun="order" />
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <h2 className="border-b border-border px-5 py-3 text-sm font-semibold">Profile</h2>
            <dl className="p-5">
              <Row label="Age">{user.age ?? "—"}</Row>
              <Row label="Gender">{gender ?? "—"}</Row>
              <Row label="District">{user.district || "—"}</Row>
              <Row label="Country">{user.country || "—"}</Row>
              <Row label="Joined">{dateFmt.format(user.createdAt)}</Row>
              {user.address && (
                <div className="pt-2">
                  <dt className="text-sm text-muted-foreground">Address</dt>
                  <dd className="mt-1 text-sm whitespace-pre-line">{user.address}</dd>
                </div>
              )}
            </dl>
          </section>

          {isAdmin ? (
            <p className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
              Admin accounts are managed with <code className="font-mono text-xs text-foreground">bun run seed:admin</code> and can&apos;t be deleted here.
            </p>
          ) : (
            <AccountDangerZone id={id} name={user.name} email={user.email} orders={s.orders} />
          )}
        </div>
      </div>
    </div>
  );
}
