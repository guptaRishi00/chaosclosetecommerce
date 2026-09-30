"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, Minus, Plus } from "lucide-react";
import { placeOrder } from "@/lib/actions/checkout.actions";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { useBag } from "@/lib/client-store";
import type { DeliveryDefaults } from "@/lib/delivery";
import { MAX_ORDER_QUANTITY } from "@/lib/orders";
import { cn, formatINR } from "@/lib/utils";
import { DeliveryFields, useDeliveryForm } from "@/components/store/delivery-fields";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number; // paise
  sizes: { size: string; stock: number }[];
  /** Checkout prefill for the logged-in customer; null when logged out. */
  delivery: DeliveryDefaults | null;
};

export function OrderPanel({ productId, slug, name, image, price, sizes, delivery }: Props) {
  const loggedIn = delivery !== null;
  const router = useRouter();
  const bag = useBag();
  const [addedToBag, setAddedToBag] = useState(false);
  const firstAvailable = sizes.find((s) => s.stock > 0)?.size ?? null;
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? firstAvailable : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [checkout, setCheckout] = useState(false); // Buy now → delivery details → Place order
  const [pending, startTransition] = useTransition();
  const deliveryForm = useDeliveryForm(delivery, "buy");

  // Opening the delivery step moves focus (and the view) to its first field.
  useEffect(() => {
    if (checkout) document.getElementById("buy-house")?.focus();
  }, [checkout]);

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

  function buyNow() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    setCheckout(true);
  }

  function order() {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    const details = deliveryForm.validate();
    if (!details) return;
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({ productId, size, quantity: qty, delivery: details });
      if (!res.ok) {
        setError(res.message);
        deliveryForm.setServerErrors(res.fieldErrors);
        router.refresh(); // stock may have changed under us: show the real numbers
        return;
      }
      setPlaced(true);
      setCheckout(false);
      router.refresh(); // show the reduced stock
    });
  }

  if (placed) {
    return (
      <div role="status" className="flex flex-col gap-3 bg-brand-cream p-5">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck className="size-5 text-success" aria-hidden />
          Order placed
        </p>
        <p className="text-sm text-ink/75">
          {qty} × size {size}, {formatINR(price * qty)}. Pay in cash when it arrives.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-semibold text-white hover:bg-brand-red active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm">
            View my orders
          </Link>
          <button
            type="button"
            onClick={() => {
              setPlaced(false);
              setQty(1);
            }}
            className="inline-flex h-9 items-center rounded-full bg-white px-4 text-xs font-semibold hover:bg-ink hover:text-white active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm"
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
        <legend className="mb-3 flex w-full items-baseline justify-between text-base font-semibold">
          Size
          {size && stockOfSize > 0 && stockOfSize <= LOW_STOCK_THRESHOLD && (
            <span className="text-sm font-medium text-brand-red">Only {stockOfSize} left in {size}</span>
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
                  "relative inline-flex h-9 min-w-12 items-center justify-center rounded-full border px-3 text-xs font-semibold tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 active:scale-95 sm:h-11 sm:min-w-14 sm:px-4 sm:text-sm",
                  selected ? "border-ink bg-ink text-white" : "border-ink/20 bg-white hover:border-ink",
                  out && "cursor-not-allowed border-ink/10 bg-transparent text-ink/30 line-through hover:border-ink/10 active:scale-100",
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
        <span id="qty-label" className="text-base font-semibold">
          Quantity
        </span>
        <div className="inline-flex h-9 w-fit items-center rounded-full border border-ink/20 bg-white px-1 sm:h-11" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-9 items-center justify-center sm:w-11 disabled:opacity-30"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <output aria-live="polite" className="w-8 text-center font-semibold tabular-nums">
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
        <p role="alert" className="bg-brand-red/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {soldOut ? (
        <div className="flex flex-col gap-2">
          <p className="inline-flex h-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground sm:h-12 sm:text-base">Sold out</p>
          <p className="text-center text-xs text-muted-foreground">Save it to your wishlist to find it again when it&apos;s back.</p>
        </div>
      ) : checkout ? (
        <section aria-labelledby="buy-delivery-heading" className="flex flex-col gap-5 bg-brand-cream p-5 sm:p-6">
          <h2 id="buy-delivery-heading" className="text-xl font-semibold tracking-tight">
            Delivery details
          </h2>
          <DeliveryFields form={deliveryForm} disabled={pending} />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={order}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base disabled:opacity-60"
            >
              {pending ? "Placing order…" : `Place order (COD) · ${formatINR(price * qty)}`}
            </button>
            <button
              type="button"
              onClick={() => setCheckout(false)}
              disabled={pending}
              className="inline-flex h-9 items-center justify-center self-center rounded-full px-4 text-sm font-semibold text-ink/70 hover:text-ink disabled:opacity-60"
            >
              Back
            </button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={addToBag}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base"
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
              onClick={buyNow}
              className="inline-flex items-center justify-center rounded-full bg-brand-cream h-10 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base disabled:opacity-60"
            >
              {`Buy now (COD) · ${formatINR(price * qty)}`}
            </button>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/product/${slug}`)}`}
              className="inline-flex items-center justify-center rounded-full bg-brand-cream h-10 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base"
            >
              Log in to buy now
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
