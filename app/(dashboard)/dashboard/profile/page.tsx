import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ProfileForm } from "@/components/forms/profile-form";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage() {
  const session = (await getCurrentUser())!; // guaranteed by the (dashboard) layout
  await connectDB();
  const user = await UserModel.findById(session.userId).lean();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/dashboard" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          My account
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">Edit profile</h1>
      </div>
      <ProfileForm
        defaults={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          age: user.age?.toString() ?? "",
          gender: user.gender ?? "",
          district: user.district ?? "",
          address: user.address ?? "",
          avatarUrl: user.avatar?.url,
        }}
      />
    </div>
  );
}
