import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WishlistView } from "@/components/store/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <SiteHeader />
      <main className="w-full px-3 pt-8 pb-20 sm:px-5 md:pt-12 lg:px-8">
        <WishlistView />
      </main>
      <SiteFooter />
    </>
  );
}
