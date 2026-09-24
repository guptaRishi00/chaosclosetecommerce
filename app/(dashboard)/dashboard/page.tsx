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

export const metadata: Metadata = { title: "My account" };

const RECENT_ORDERS = 20;
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Customer-facing wording for the admin's fulfilment states (cash on delivery).
const STATUS: Record<string, { label: string; className: string }> = {
  "not-delivered": { label: "On its way · pay on delivery", className: "bg-brand-cream text-black" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-900" },
  returned: { label: "Returned", className: "bg-black/10 text-black/70" },
};

// Server Component: profile and orders are read on the server; nothing client-side to sync.
export default async function DashboardPage() {
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
    ["Age", user.age?.toString()],
    ["Gender", GENDERS.find((g) => g.value === user.gender)?.label],
    ["District", user.district],
    ["Address", user.address],
    ["Country", user.country],
  ] as const;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <header className="flex flex-col gap-5 border-b border-black/15 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 border border-black/10 sm:size-16">
            {user.avatar?.url && <AvatarImage src={user.avatar.url} alt="" className="object-cover" />}
            <AvatarFallback className="bg-brand-cream text-lg font-semibold">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-brand-red uppercase">My account</p>
            <h1 className="truncate font-heading text-xl font-extrabold uppercase sm:text-3xl">Hi, {user.name.split(" ")[0]}</h1>
            <p className="truncate text-sm text-black/60">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 sm:gap-8">
          <dl className="flex gap-6 sm:gap-8">
            {stats.map(([label, n]) => (
              <div key={label}>
                <dt className="text-xs text-black/55">{label}</dt>
                <dd className="font-heading text-xl font-extrabold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
          <form action={logout} className="ml-auto sm:ml-0">
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 border border-black/20 px-2.5 text-[11px] sm:h-10 sm:gap-2 sm:px-3 sm:text-xs font-bold tracking-wide uppercase transition-colors hover:border-black hover:bg-black hover:text-white"
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
            <h2 id="orders-heading" className="font-heading text-lg font-extrabold uppercase">
              My orders
            </h2>
            {totalOrders > RECENT_ORDERS && <p className="text-xs text-black/55">Latest {RECENT_ORDERS}</p>}
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-dashed border-black/20 bg-white/60 px-6 py-14 text-center">
              <ShoppingBag className="size-8 text-black/30" strokeWidth={1.25} aria-hidden />
              <p className="text-sm text-black/60">No orders yet. Everything ships cash on delivery.</p>
              <Link href="/" className="inline-flex h-9 items-center bg-black px-4 text-xs sm:h-10 font-bold tracking-wide text-white uppercase hover:bg-brand-red">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-black/10 border border-black/10 bg-white">
              {orders.map((o) => {
                const slug = slugOf.get(String(o.product));
                const s = STATUS[o.fulfillment] ?? STATUS["not-delivered"];
                const name = slug ? (
                  <Link href={`/product/${slug}`} className="font-bold uppercase underline-offset-4 hover:underline">
                    {o.productName}
                  </Link>
                ) : (
                  <span className="font-bold uppercase">{o.productName}</span>
                );
                return (
                  <li key={String(o._id)} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                    <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-[#efe6d2] sm:w-20">
                      {o.productImage && <Image src={o.productImage} alt="" fill sizes="80px" className="object-cover" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm tracking-wide">{name}</p>
                        <p className="mt-1 text-xs text-black/60">
                          Size {o.size} × {o.quantity} · {dateFmt.format(o.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-col sm:items-end sm:gap-1">
                        <span className="text-sm font-semibold tabular-nums">{formatINR(o.amount)}</span>
                        <span className={cn("px-2 py-0.5 text-xs font-medium whitespace-nowrap", s.className)}>{s.label}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="profile-heading" className="border border-black/10 bg-white p-5 lg:sticky lg:top-24">
          <h2 id="profile-heading" className="text-sm font-bold tracking-wider uppercase">
            Profile
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-black/55">{label}</dt>
                <dd className="text-sm break-words">{value || "Not set"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
