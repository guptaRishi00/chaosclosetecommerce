import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShoppingBag } from "lucide-react";
import { logout } from "@/lib/actions/auth.actions";
import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/db";
import { GENDERS } from "@/lib/validations/auth";
import { cn, formatINR } from "@/lib/utils";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { UserModel } from "@/models/User";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountShortcuts } from "@/components/store/account-shortcuts";
import { CancelOrderButton } from "@/components/store/cancel-order-button";

export const metadata: Metadata = { title: "My account" };

const RECENT_ORDERS = 20;
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

// Customer-facing wording for the admin's fulfilment states (cash on delivery).
const STATUS: Record<string, { label: string; className: string }> = {
  "not-delivered": { label: "On its way, pay on delivery", className: "bg-brand-cream text-ink" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-900" },
  returned: { label: "Returned", className: "bg-muted text-ink/70" },
  cancelled: { label: "Cancelled", className: "bg-muted text-ink/60" },
};

// Server Component: profile and orders are read on the server; nothing client-side to sync.
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const profileSaved = (await searchParams).profile === "saved";
  const session = (await getCurrentUser())!; // guaranteed by the (dashboard) layout

  await connectDB();
  const user = await UserModel.findById(session.userId).lean();
  if (!user) redirect("/login");
  const [orders, byStatus] = await Promise.all([
    OrderModel.find({ user: user._id }).sort({ createdAt: -1 }).limit(RECENT_ORDERS).lean(),
    OrderModel.aggregate<{ _id: string; n: number }>([{ $match: { user: user._id } }, { $group: { _id: "$fulfillment", n: { $sum: 1 } } }]),
  ]);
  // Link each order to its product page if the product still exists.
  const live = await ProductModel.find({ _id: { $in: orders.map((o) => o.product) } }, { slug: 1 }).lean();
  const slugOf = new Map(live.map((p) => [String(p._id), p.slug]));

  const count = (k: string) => byStatus.find((s) => s._id === k)?.n ?? 0;
  const totalOrders = byStatus.reduce((n, s) => n + s.n, 0);
  const stats = [
    ["Orders", totalOrders],
    ["On the way", count("not-delivered")],
    ["Delivered", count("delivered")],
  ] as const;

  const rows = [
    ["Email", user.email],
    ["Mobile", user.phone],
    ["Age", user.age?.toString()],
    ["Gender", GENDERS.find((g) => g.value === user.gender)?.label],
    ["District", user.district],
    ["Address", user.address],
    ["Country", user.country],
  ] as const;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <header className="flex flex-col gap-5 border-b border-ink/12 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 border border-ink/10 sm:size-16">
            {user.avatar?.url && <AvatarImage src={user.avatar.url} alt="" className="object-cover" />}
            <AvatarFallback className="bg-brand-cream text-lg font-semibold">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">My account</p>
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">Hi, {user.name.split(" ")[0]}</h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-8">
          <dl className="flex gap-5 sm:gap-8">
            {stats.map(([label, n]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          <form action={logout} className="ml-auto sm:ml-0">
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-cream px-3 text-xs font-semibold transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <LogOut className="size-3.5 sm:size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </header>

      <AccountShortcuts orderCount={totalOrders} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <section id="orders" aria-labelledby="orders-heading" className="flex min-w-0 scroll-mt-24 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="orders-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
              My orders
            </h2>
            {totalOrders > RECENT_ORDERS && <p className="text-xs text-muted-foreground">Latest {RECENT_ORDERS}</p>}
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 bg-brand-cream px-6 py-14 text-center">
              <ShoppingBag className="size-8 text-ink/30" strokeWidth={1.25} aria-hidden />
              <p className="text-sm text-ink/70">No orders yet. Everything ships cash on delivery.</p>
              <Link href="/" className="inline-flex h-9 items-center rounded-full bg-ink px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-10 sm:text-sm">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
              {orders.map((o) => {
                const slug = slugOf.get(String(o.product));
                const s = STATUS[o.fulfillment] ?? STATUS["not-delivered"];
                const name = slug ? (
                  <Link href={`/product/${slug}`} className="font-semibold underline-offset-4 hover:underline">
                    {o.productName}
                  </Link>
                ) : (
                  <span className="font-semibold">{o.productName}</span>
                );
                return (
                  <li key={String(o._id)} className="flex gap-3 py-4 sm:gap-4">
                    <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-brand-cream sm:w-20">
                      {o.productImage && <Image src={o.productImage} alt="" fill sizes="80px" className="object-cover" />}
                    </div>
                    {/* Details + price on top; status (left) and its action (right) share the footer line,
                        like a bag line's stepper + Remove. Same layout at every width. */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[15px]">{name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Size {o.size} × {o.quantity} · {dateFmt.format(o.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[15px] font-semibold tabular-nums">{formatINR(o.amount)}</span>
                      </div>
                      <div className="mt-auto flex min-h-10 items-center justify-between gap-3 sm:min-h-9">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", s.className)}>{s.label}</span>
                        {o.fulfillment === "not-delivered" && (
                          <CancelOrderButton
                            orderId={String(o._id)}
                            summary={`${o.productName}, size ${o.size} × ${o.quantity}, ${formatINR(o.amount)}`}
                          />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="profile-heading" className="bg-brand-cream p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <h2 id="profile-heading" className="text-xl font-semibold tracking-tight">
              Profile
            </h2>
            <Link
              href="/dashboard/profile"
              className="inline-flex h-8 items-center rounded-full bg-white px-4 text-xs font-semibold transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-9 sm:text-sm"
            >
              Edit profile
            </Link>
          </div>
          {profileSaved && (
            <p role="status" className="mt-3 text-sm font-medium text-success">
              Profile updated.
            </p>
          )}
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-ink/65">{label}</dt>
                <dd className="text-sm break-words">{value || "Not set"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
