"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, Minus, Plus } from "lucide-react";
import { placeOrder } from "@/lib/actions/checkout.actions";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { useBag } from "@/lib/client-store";
import { MAX_ORDER_QUANTITY } from "@/lib/orders";
import { cn, formatINR } from "@/lib/utils";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number; // paise
  sizes: { size: string; stock: number }[];
  loggedIn: boolean;
};

export function OrderPanel({ productId, slug, name, image, price, sizes, loggedIn }: Props) {
  const router = useRouter();
  const bag = useBag();
  const [addedToBag, setAddedToBag] = useState(false);
  const firstAvailable = sizes.find((s) => s.stock > 0)?.size ?? null;
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? firstAvailable : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();

  const soldOut = sizes.every((s) => s.stock <= 0);
  const stockOfSize = sizes.find((s) => s.size === size)?.stock ?? 0;
  const maxQty = Math.max(1, Math.min(MAX_ORDER_QUANTITY, stockOfSize));

  function addToBag() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    bag.add({ productId, slug, name, image, price, size }, qty, maxQty);
    setAddedToBag(true);
    window.setTimeout(() => setAddedToBag(false), 2500);
  }

  function order() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({ productId, size, quantity: qty });
      if (!res.ok) {
        setError(res.message);
        router.refresh(); // stock may have changed under us: show the real numbers
        return;
      }
      setPlaced(true);
      router.refresh(); // show the reduced stock
    });
  }

  if (placed) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg border border-black bg-white p-5">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck className="size-5 text-green-700" aria-hidden />
          Order placed
        </p>
        <p className="text-sm text-black/70">
          {qty} × size {size}, {formatINR(price * qty)}. Pay in cash when it arrives.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex h-9 items-center rounded-md bg-black px-3 text-xs sm:h-10 sm:px-4 sm:text-sm font-semibold text-white hover:bg-brand-red">
            View my orders
          </Link>
          <button
            type="button"
            onClick={() => {
              setPlaced(false);
              setQty(1);
            }}
            className="inline-flex h-9 items-center rounded-md border border-black/20 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm font-semibold hover:border-black"
          >
            Order another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-3 flex w-full items-baseline justify-between text-sm font-semibold">
          Size
          {size && stockOfSize > 0 && stockOfSize <= LOW_STOCK_THRESHOLD && (
            <span className="text-xs font-normal text-brand-red">Only {stockOfSize} left in {size}</span>
          )}
        </legend>
        <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const out = s.stock <= 0;
            const selected = size === s.size;
            return (
              <button
                key={s.size}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={out}
                onClick={() => {
                  setSize(s.size);
                  setQty((q) => Math.min(q, Math.max(1, Math.min(MAX_ORDER_QUANTITY, s.stock))));
                  setError(null);
                }}
                className={cn(
                  "relative inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-2.5 font-mono text-xs sm:h-11 sm:min-w-12 sm:px-3 sm:text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
                  selected ? "border-black bg-black text-white" : "border-black/25 bg-white hover:border-black",
                  out && "cursor-not-allowed border-black/10 bg-transparent text-black/30 line-through hover:border-black/10",
                )}
              >
                {s.size}
                {out && <span className="sr-only"> (sold out)</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <span id="qty-label" className="text-sm font-semibold">
          Quantity
        </span>
        <div className="inline-flex h-9 w-fit items-center rounded-md border sm:h-11 border-black/25 bg-white" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-9 items-center justify-center sm:w-11 disabled:opacity-30"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <output aria-live="polite" className="w-8 text-center font-mono tabular-nums">
            {qty}
          </output>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={!size || qty >= maxQty}
            aria-label="Increase quantity"
            className="flex h-full w-9 items-center justify-center sm:w-11 disabled:opacity-30"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-brand-red/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {soldOut ? (
        <div className="flex flex-col gap-2">
          <p className="inline-flex h-10 items-center justify-center rounded-md bg-black/10 text-xs sm:h-12 sm:text-sm font-semibold text-black/60">Sold out</p>
          <p className="text-center text-xs text-black/55">Save it to your wishlist to find it again when it&apos;s back.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={addToBag}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-black h-10 px-4 text-xs sm:h-12 sm:px-6 sm:text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-red active:translate-y-px"
          >
            {addedToBag ? (
              <>
                <Check className="size-4" aria-hidden /> Added to bag
              </>
            ) : (
              "Add to bag"
            )}
          </button>
          <p aria-live="polite" className="sr-only">
            {addedToBag ? `${qty} × ${size} added to your bag` : ""}
          </p>
          {addedToBag && (
            <Link href="/cart" className="text-center text-sm font-semibold underline underline-offset-4 hover:text-brand-red">
              View bag and check out
            </Link>
          )}
          {loggedIn ? (
            <button
              type="button"
              onClick={order}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-md border-2 border-brand-red h-10 px-4 text-xs sm:h-12 sm:px-6 sm:text-sm font-bold tracking-wide text-brand-red uppercase transition-colors hover:bg-brand-red hover:text-white active:translate-y-px disabled:opacity-60"
            >
              {pending ? "Placing order…" : `Buy now · COD · ${formatINR(price * qty)}`}
            </button>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/product/${slug}`)}`}
              className="inline-flex items-center justify-center rounded-md border-2 border-black/80 h-10 px-4 text-xs sm:h-12 sm:px-6 sm:text-sm font-bold tracking-wide uppercase hover:bg-black hover:text-white"
            >
              Log in to buy now
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
