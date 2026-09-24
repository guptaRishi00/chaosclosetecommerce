"use client";

import { Heart } from "lucide-react";
import { useWishlist, type WishItem } from "@/lib/client-store";
import { cn } from "@/lib/utils";

export function WishlistButton({ item, className, size = "md" }: { item: WishItem; className?: string; size?: "md" | "lg" }) {
  const wish = useWishlist();
  const saved = wish.has(item.productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // cards wrap links; never navigate when toggling
        wish.toggle(item);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition hover:bg-white active:scale-95",
        size === "md" ? "size-8 sm:size-9" : "size-10 border border-black/15 sm:size-11",
        className,
      )}
    >
      <Heart className={cn(size === "md" ? "size-3.5 sm:size-4" : "size-4 sm:size-5", saved && "fill-brand-red text-brand-red")} strokeWidth={2} aria-hidden />
    </button>
  );
}
