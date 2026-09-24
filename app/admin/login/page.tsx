import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams; // sanitized server-side in adminLogin
  if (await requireAdmin()) redirect("/admin"); // DB-verified, so a stale admin token can't loop

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-[340px] flex-col gap-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <Image src="/logo-wordmark.png" alt="Chaos Closet" width={576} height={133} priority className="h-8 w-auto invert" />
          <h1 className="text-2xl font-semibold tracking-tight">Log in to Admin</h1>
        </div>
        <AdminLoginForm next={next} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </main>
  );
}
