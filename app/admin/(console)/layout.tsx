import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserMenu } from "@/components/admin/user-menu";

// Every console page re-verifies admin against the DB (middleware only checks the JWT claim).
export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <Link href="/admin" aria-label="Admin home" className="shrink-0">
              <Image src="/logo-wordmark.png" alt="" width={576} height={133} priority className="h-5 w-auto invert" />
            </Link>
            {/* Vercel's slanted breadcrumb divider */}
            <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 text-border" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M16.88 3.549L7.12 20.451" />
            </svg>
            <span className="truncate font-medium">{admin.name}</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              Admin
            </span>
          </div>
          <UserMenu name={admin.name} email={admin.email} />
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
