"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Shirt } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { useBag } from "@/lib/client-store";
import type { ProductCardData } from "@/lib/storefront";
import { cn, formatINR } from "@/lib/utils";
import { WishlistButton } from "@/components/store/wishlist-button";

const SIZES_ATTR = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

/**
 * Streetwear-store card (after Bonkers Corner / Urban Monkey): 3:4 photo, second photo on hover,
 * wishlist heart, honest stock badge, and a "Quick add" size bar on pointer devices. Name + price below.
 */
export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const bag = useBag();
  const [added, setAdded] = useState<string | null>(null);
  const total = product.sizes.reduce((n, s) => n + s.stock, 0);
  const [cover, hover] = product.images;
  const href = `/product/${product.slug}`;

  function quickAdd(size: string) {
    bag.add({ productId: product.id, slug: product.slug, name: product.name, image: cover, price: product.price, size }, 1, Math.min(10, product.sizes.find((s) => s.size === size)?.stock ?? 1));
    setAdded(size);
    window.setTimeout(() => setAdded(null), 1600);
  }

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#efe6d2]">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          {cover ? (
            <>
              <Image
                src={cover}
                alt=""
                fill
                priority={priority}
                sizes={SIZES_ATTR}
                className={cn(
                  "object-cover transition duration-500 ease-out motion-reduce:transition-none",
                  hover ? "group-hover:opacity-0" : "group-hover:scale-[1.04] motion-reduce:group-hover:scale-100",
                  total === 0 && "opacity-60 grayscale",
                )}
              />
              {hover && (
                <Image src={hover} alt="" fill sizes={SIZES_ATTR} className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none" />
              )}
            </>
          ) : (
            <span className="flex size-full items-center justify-center text-black/25">
              <Shirt className="size-10" strokeWidth={1.25} />
            </span>
          )}
        </Link>

        {total === 0 ? (
          <span className="absolute top-2 left-2 bg-black px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase">Sold out</span>
        ) : total <= LOW_STOCK_THRESHOLD ? (
          <span className="absolute top-2 left-2 bg-brand-red px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase">Only {total} left</span>
        ) : null}

        <WishlistButton
          item={{ productId: product.id, slug: product.slug, name: product.name, image: cover, price: product.price }}
          className="absolute top-2 right-2"
        />

        {/* Quick add: pointer devices on hover, keyboard via focus-within. Touch → product page. */}
        {total > 0 && (
          <div className="absolute inset-x-2 bottom-2 hidden translate-y-2 flex-col gap-2 bg-white/95 p-2.5 opacity-0 shadow-sm backdrop-blur transition duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none lg:flex">
            {added ? (
              <p role="status" className="flex h-8 items-center justify-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                <Check className="size-4 text-green-700" aria-hidden /> Added to bag · {added}
              </p>
            ) : (
              <>
                <p className="text-center text-[10px] font-bold tracking-wider text-black/60 uppercase">Quick add</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {product.sizes.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      disabled={s.stock <= 0}
                      onClick={() => quickAdd(s.size)}
                      aria-label={`Add size ${s.size} of ${product.name} to bag`}
                      className="h-8 min-w-9 border border-black/20 px-2 font-mono text-xs font-semibold transition-colors hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:text-black/25 disabled:line-through disabled:hover:border-black/20 disabled:hover:bg-transparent"
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 pt-3">
        <h3 className="line-clamp-2 text-[13px] leading-snug font-bold tracking-wide uppercase">
          {/* The photo is also a link (mouse-only, aria-hidden) so this is the one keyboard/SR stop */}
          <Link href={href} className="underline-offset-4 outline-none hover:underline focus-visible:underline">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm font-semibold tabular-nums">{formatINR(product.price)}</p>
      </div>
    </article>
  );
}
