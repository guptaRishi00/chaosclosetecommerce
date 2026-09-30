import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { getDeliveryDefaults } from "@/lib/delivery";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BagView } from "@/components/store/bag-view";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false } };

export default async function CartPage() {
  const user = await getCurrentUser();
  const delivery = user ? await getDeliveryDefaults(user) : null;
  return (
    <>
      <SiteHeader />
      <main className="w-full px-3 pt-8 pb-20 sm:px-5 md:pt-12 lg:px-8">
        <BagView delivery={delivery} />
      </main>
      <SiteFooter />
    </>
  );
}
