import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Already signed in (DB-checked, so a deleted account's stale token can't loop) → skip the form.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-extrabold uppercase">Join the closet</h1>
        <p className="text-sm text-muted-foreground">Create your account for early drops and faster checkout.</p>
      </div>
      <RegisterForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-brand-red underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
