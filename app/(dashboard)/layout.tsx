import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Second line of defence after middleware.ts: every page in this group re-verifies the
// session AND that the account still exists (an admin may have deleted it).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="w-full flex-1 px-3 pt-8 pb-20 sm:px-5 md:pt-12 lg:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
