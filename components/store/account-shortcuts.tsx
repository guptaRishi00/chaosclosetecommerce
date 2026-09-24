"use client";

import Link from "next/link";
import { ArrowRight, Heart, Package, ShoppingBag } from "lucide-react";
import { useBag, useWishlist } from "@/lib/client-store";

/** Quick links on the account page. Wishlist and bag live in this browser, so their counts are read client-side. */
export function AccountShortcuts({ orderCount }: { orderCount: number }) {
  const bag = useBag();
  const wish = useWishlist();
  const links = [
    { href: "#orders", label: "My orders", detail: orderCount === 1 ? "1 order" : `${orderCount} orders`, Icon: Package },
    { href: "/wishlist", label: "Wishlist", detail: `${wish.count} saved`, Icon: Heart },
    { href: "/cart", label: "Bag", detail: bag.count === 1 ? "1 item" : `${bag.count} items`, Icon: ShoppingBag },
  ];

  return (
    <nav aria-label="Account shortcuts" className="grid grid-cols-1 gap-px border border-black/10 bg-black/10 sm:grid-cols-3">
      {links.map(({ href, label, detail, Icon }) => (
        <Link key={href} href={href} className="group flex min-w-0 items-center gap-3 bg-white px-4 py-3 sm:py-4 transition-colors hover:bg-brand-cream">
          <Icon className="size-5 shrink-0 text-brand-red" strokeWidth={1.75} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold tracking-wide uppercase">{label}</span>
            <span className="block text-xs text-black/60">{detail}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-black/40 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      ))}
    </nav>
  );
}
