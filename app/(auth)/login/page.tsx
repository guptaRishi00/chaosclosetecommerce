import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams; // sanitized server-side in the login action
  // Already signed in (DB-checked, so a deleted account's stale token can't loop) → skip the form.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6 lg:pt-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-extrabold uppercase">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to see your wishlist, bag and orders.</p>
      </div>
      <LoginForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        New to Chaos Closet?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-semibold text-brand-red underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
