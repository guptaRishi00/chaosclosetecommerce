"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getProductsBySlugs } from "@/lib/actions/bag.actions";
import { useWishlist } from "@/lib/client-store";
import type { ProductCardData } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";

/** Saved items, re-read from the server so price/stock/photos are current. Hearts toggle removal. */
export function WishlistView() {
  const wish = useWishlist();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const slugs = wish.items.map((w) => w.slug).join(",");

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const list = slugs ? slugs.split(",") : [];
    if (list.length === 0) {
      setProducts([]);
      return;
    }
    setFailed(false);
    getProductsBySlugs(list).then(
      (p) => !cancelled && setProducts(p),
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [slugs, hydrated]);

  // Items whose product was deleted: tell the shopper instead of silently dropping them.
  const missing = products ? wish.items.filter((w) => !products.some((p) => p.slug === w.slug)) : [];
  const visible = products?.filter((p) => wish.has(p.id)) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-4 border-b border-black/15 pb-4">
        <h1 className="font-heading text-2xl font-extrabold uppercase sm:text-3xl">Wishlist</h1>
        {hydrated && wish.count > 0 && (
          <p className="text-sm text-black/60">
            {wish.count} saved
          </p>
        )}
      </div>

      {failed ? (
        <p role="alert" className="py-16 text-center text-sm text-black/70">
          Couldn&apos;t load your wishlist.{" "}
          <button type="button" onClick={() => location.reload()} className="font-semibold underline underline-offset-4 hover:text-brand-red">
            Try again
          </button>
        </p>
      ) : !hydrated || products === null ? (
        <div aria-hidden className="grid grid-cols-2 gap-x-2 gap-y-8 sm:grid-cols-3 sm:gap-x-3 lg:grid-cols-4 lg:gap-x-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] animate-pulse bg-black/10" />
              <div className="h-3 w-3/4 animate-pulse bg-black/10" />
            </div>
          ))}
        </div>
      ) : wish.count === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <Heart className="size-12 text-black/30" strokeWidth={1.25} aria-hidden />
          <p className="font-heading text-xl font-extrabold uppercase">Nothing saved yet</p>
          <p className="text-black/60">Tap the heart on any product to keep it here.</p>
          <Link href="/" className="inline-flex items-center bg-black h-9 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm font-bold tracking-wide text-white uppercase hover:bg-brand-red">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-2 gap-y-10 sm:grid-cols-3 sm:gap-x-3 lg:grid-cols-4 lg:gap-x-4">
            {visible.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          {missing.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-black/10 bg-white px-4 py-3 text-sm">
              <p className="text-black/70">
                {missing.length} saved item{missing.length === 1 ? " is" : "s are"} no longer available.
              </p>
              <button type="button" onClick={() => missing.forEach((m) => wish.remove(m.productId))} className="font-semibold underline underline-offset-4 hover:text-brand-red">
                Clear {missing.length === 1 ? "it" : "them"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
