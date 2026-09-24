"use client";

import { useBag, useWishlist } from "@/lib/client-store";

/** Count bubble for the navbar icons. Renders nothing until there's something to count. */
export function NavCount({ kind }: { kind: "bag" | "wishlist" }) {
  const bag = useBag();
  const wish = useWishlist();
  const n = kind === "bag" ? bag.count : wish.count;
  if (n === 0) return null;
  return (
    <span
      aria-label={`${n} item${n === 1 ? "" : "s"}`}
      className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] leading-none font-bold text-white tabular-nums"
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
