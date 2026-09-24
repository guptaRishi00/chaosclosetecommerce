import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { PAGE_SIZE, pageInfo, parsePage } from "@/lib/pagination";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { AccountRowActions } from "@/components/admin/account-row-actions";
import { ListPagination } from "@/components/admin/list-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Accounts" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function RoleBadge({ admin }: { admin: boolean }) {
  return (
    <span
      className={
        admin
          ? "inline-flex h-6 shrink-0 items-center rounded-full border border-[#52a8ff]/40 bg-[#52a8ff]/10 px-2.5 text-xs font-medium text-[#52a8ff]"
          : "inline-flex h-6 shrink-0 items-center rounded-full border border-border px-2.5 text-xs text-muted-foreground"
      }
    >
      {admin ? "Admin" : "Customer"}
    </span>
  );
}

export default async function AdminAccountsPage({ searchParams }: { searchParams: Promise<{ page?: string; deleted?: string }> }) {
  const { page: rawPage, deleted } = await searchParams;
  const me = (await requireAdmin())!; // console layout already redirected non-admins

  await connectDB();
  const info = pageInfo(await UserModel.countDocuments(), parsePage(rawPage));
  const users = await UserModel.find()
    .select("name email role district avatar createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .skip(info.skip)
    .limit(PAGE_SIZE)
    .lean();

  // Order counts for just this page's users, in one query.
  const counts = await OrderModel.aggregate<{ _id: unknown; n: number }>([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$user", n: { $sum: 1 } } },
  ]);
  const ordersOf = new Map(counts.map((c) => [String(c._id), c.n]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has signed up. Deleting a customer signs them out and removes their account; their orders are kept.
        </p>
      </div>

      {deleted && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <CircleCheck className="size-4 shrink-0 text-success" />
          <span>{deleted.slice(0, 200)} was deleted.</span>
        </div>
      )}

      {info.total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No accounts yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Below md: stacked cards (the table needs ~640px and would scroll sideways) */}
          <ul className="divide-y divide-border md:hidden">
            {users.map((u) => {
              const id = String(u._id);
              const isAdmin = u.role === "admin";
              const n = ordersOf.get(id) ?? 0;
              return (
                <li key={id} className="relative flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
                  <Avatar className="size-10 border border-border">
                    {u.avatar?.url && <AvatarImage src={u.avatar.url} alt="" className="object-cover" />}
                    <AvatarFallback className="bg-muted text-sm">{u.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Stretched link: the card opens the account; the delete button sits above it (z-10) */}
                      <Link href={`/admin/accounts/${id}`} className="truncate font-medium after:absolute after:inset-0 hover:underline">
                        {u.name}
                        {id === me.userId && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                      </Link>
                      <RoleBadge admin={isAdmin} />
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {u.district || "No district"} · {n} order{n === 1 ? "" : "s"} · Joined {dateFmt.format(u.createdAt)}
                    </span>
                  </div>
                  {!isAdmin && (
                    <div className="relative z-10 -mr-2 shrink-0">
                      <AccountRowActions id={id} name={u.name} email={u.email} orders={n} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-normal text-muted-foreground">Account</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs font-normal text-muted-foreground">District</TableHead>
                <TableHead className="text-right text-xs font-normal text-muted-foreground">Orders</TableHead>
                <TableHead className="text-right text-xs font-normal text-muted-foreground">Joined</TableHead>
                <TableHead className="w-12 pr-3">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const id = String(u._id);
                const isAdmin = u.role === "admin";
                return (
                  <TableRow key={id} className="relative">
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-border">
                          {u.avatar?.url && <AvatarImage src={u.avatar.url} alt="" className="object-cover" />}
                          <AvatarFallback className="bg-muted text-xs">{u.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          {/* Stretched link: the row opens the account; the delete button sits above it (z-10) */}
                          <Link href={`/admin/accounts/${id}`} className="truncate font-medium after:absolute after:inset-0 hover:underline">
                            {u.name}
                            {id === me.userId && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                          </Link>
                          <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge admin={isAdmin} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.district || "—"}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{ordersOf.get(id) ?? 0}</TableCell>
                    <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground">{dateFmt.format(u.createdAt)}</TableCell>
                    <TableCell className="relative z-10 pr-3 text-right">
                      {isAdmin ? (
                        <span title="Admin accounts are managed with the seed script" className="text-xs text-muted-foreground">
                          —
                        </span>
                      ) : (
                        <AccountRowActions id={id} name={u.name} email={u.email} orders={ordersOf.get(id) ?? 0} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <ListPagination info={info} basePath="/admin/accounts" noun="account" />
    </div>
  );
}
