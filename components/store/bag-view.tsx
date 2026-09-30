"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from "lucide-react";
import { placeBagOrder, quoteBag, type QuotedLine } from "@/lib/actions/bag.actions";
import { useBag, useWishlist } from "@/lib/client-store";
import type { DeliveryDefaults } from "@/lib/delivery";
import { MAX_ORDER_QUANTITY } from "@/lib/orders";
import { cn, formatINR } from "@/lib/utils";
import { DeliveryFields, useDeliveryForm } from "@/components/store/delivery-fields";

type Props = {
  /** Checkout prefill for the logged-in customer; null when logged out. */
  delivery: DeliveryDefaults | null;
};

export function BagView({ delivery }: Props) {
  const loggedIn = delivery !== null;
  const deliveryForm = useDeliveryForm(delivery, "bag");
  const bag = useBag();
  const wish = useWishlist();
  const [quotes, setQuotes] = useState<Map<string, QuotedLine> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const key = (productId: string, size: string) => `${productId}:${size}`;
  const signature = bag.lines.map((l) => `${key(l.productId, l.size)}x${l.quantity}`).join("|");

  // Re-price and re-check stock on the server whenever the bag changes.
  useEffect(() => {
    setError(null); // a previous checkout error described the old bag
    if (bag.lines.length === 0) {
      setQuotes(new Map());
      return;
    }
    let cancelled = false;
    quoteBag(bag.lines.map(({ productId, size, quantity }) => ({ productId, size, quantity }))).then(
      (res) => {
        if (cancelled) return;
        if (res.ok) setQuotes(new Map(res.lines.map((q) => [key(q.productId, q.size), q])));
        else setError(res.message);
      },
      // Show saved prices; the server re-checks price and stock when the order is placed anyway.
      () => !cancelled && (setQuotes(new Map()), setError("Couldn't refresh prices and stock. Refresh the page to try again.")),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature captures every change that matters
  }, [signature]);

  const rows = useMemo(
    () =>
      bag.lines.map((l) => {
        const q = quotes?.get(key(l.productId, l.size));
        const unit = q?.unitPrice ?? l.price;
        const gone = q ? q.unitPrice === null : false;
        const stock = q?.stock ?? Infinity;
        const problem = gone ? "No longer available" : stock === 0 ? `Sold out in ${l.size}` : l.quantity > stock ? `Only ${stock} left in ${l.size}` : null;
        return { line: l, quote: q, unit, gone, stock, problem };
      }),
    [bag.lines, quotes],
  );

  const subtotal = rows.reduce((n, r) => n + (r.gone ? 0 : r.unit * r.line.quantity), 0);
  const itemCount = rows.reduce((n, r) => n + (r.gone ? 0 : r.line.quantity), 0);
  const hasProblem = rows.some((r) => r.problem);
  const checking = bag.lines.length > 0 && quotes === null;

  function checkout() {
    const details = deliveryForm.validate();
    if (!details) return;
    setError(null);
    startTransition(async () => {
      const res = await placeBagOrder(
        bag.lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
        details,
      ).catch(() => null);
      if (!res) {
        setError("Couldn't reach the store. Nothing was ordered, try again.");
        return;
      }
      if (!res.ok) {
        setError(res.message);
        deliveryForm.setServerErrors(res.fieldErrors);
        // re-quote so the failing line shows its real stock
        const q = await quoteBag(bag.lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })));
        if (q.ok) setQuotes(new Map(q.lines.map((x) => [key(x.productId, x.size), x])));
        return;
      }
      bag.clear();
      setPlaced(res.orders);
    });
  }

  if (!hydrated) return <BagSkeleton />;

  if (placed !== null) {
    return (
      <div role="status" className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <CircleCheck className="size-12 text-success" strokeWidth={1.5} aria-hidden />
        <h1 className="text-3xl font-semibold tracking-tight">Order placed</h1>
        <p className="text-ink/70">
          {placed} item{placed === 1 ? "" : "s"} on the way. Pay in cash when {placed === 1 ? "it arrives" : "they arrive"}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard#orders" className="inline-flex items-center justify-center rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base">
            View my orders
          </Link>
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-brand-cream h-10 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  if (bag.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <ShoppingBag className="size-12 text-ink/30" strokeWidth={1.25} aria-hidden />
        <h1 className="text-3xl font-semibold tracking-tight">Your bag is empty</h1>
        <p className="text-muted-foreground">Add pieces from a product page, or hover a product and use Quick add.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base">
            Start shopping
          </Link>
          {wish.count > 0 && (
            <Link href="/wishlist" className="inline-flex items-center justify-center rounded-full bg-brand-cream h-10 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base">
              Wishlist ({wish.count})
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <section aria-labelledby="bag-heading" className="min-w-0">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/12 pb-4">
          <h1 id="bag-heading" className="text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">
            Your bag
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {bag.count} item{bag.count === 1 ? "" : "s"}
          </p>
        </div>

        <ul className="divide-y divide-ink/10">
          {rows.map(({ line, quote, unit, gone, stock, problem }) => {
            const href = quote?.slug ? `/product/${quote.slug}` : `/product/${line.slug}`;
            const max = Math.max(1, Math.min(MAX_ORDER_QUANTITY, Number.isFinite(stock) ? stock : MAX_ORDER_QUANTITY));
            return (
              <li key={key(line.productId, line.size)} className="flex gap-3 py-5 sm:gap-5">
                <Link href={href} className={cn("relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-brand-cream min-[380px]:w-24 sm:w-28", gone && "pointer-events-none opacity-50")}>
                  {(quote?.image ?? line.image) && <Image src={(quote?.image ?? line.image)!} alt="" fill sizes="112px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={href} className="line-clamp-2 text-[15px] font-semibold underline-offset-4 hover:underline">
                        {quote?.name ?? line.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">Size {line.size}</p>
                    </div>
                    <p className="shrink-0 text-[15px] font-semibold tabular-nums">{gone ? "-" : formatINR(unit * line.quantity)}</p>
                  </div>

                  {problem && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-red">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden /> {problem}
                      {!gone && stock > 0 && line.quantity > stock && (
                        <button type="button" onClick={() => bag.setQuantity(line.productId, line.size, stock)} className="ml-1 underline underline-offset-2">
                          Update to {stock}
                        </button>
                      )}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    {!gone && stock > 0 ? (
                      <div className="inline-flex h-8 items-center rounded-full border border-ink/20 px-0.5 sm:h-9" role="group" aria-label={`Quantity for ${line.name}, size ${line.size}`}>
                        <button
                          type="button"
                          onClick={() => bag.setQuantity(line.productId, line.size, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-full w-8 items-center sm:w-9 justify-center disabled:opacity-30"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <output className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</output>
                        <button
                          type="button"
                          onClick={() => bag.setQuantity(line.productId, line.size, Math.min(max, line.quantity + 1))}
                          disabled={line.quantity >= max}
                          aria-label="Increase quantity"
                          className="flex h-full w-8 items-center sm:w-9 justify-center disabled:opacity-30"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => bag.remove(line.productId, line.size)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-brand-red sm:h-9 sm:text-sm"
                    >
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside aria-labelledby="summary-heading" className="flex flex-col gap-5 bg-brand-cream p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 id="summary-heading" className="text-xl font-semibold tracking-tight">
          Order summary
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Items ({itemCount})</dt>
            <dd className="tabular-nums">{checking ? "…" : formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Delivery</dt>
            <dd>Free in Dibrugarh</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Payment</dt>
            <dd>Cash on delivery</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-ink/12 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{checking ? "…" : formatINR(subtotal)}</dd>
          </div>
        </dl>

        {loggedIn && (
          <section aria-labelledby="bag-delivery-heading" className="flex flex-col gap-4 border-t border-ink/12 pt-5">
            <h3 id="bag-delivery-heading" className="text-base font-semibold">
              Delivery details
            </h3>
            <DeliveryFields form={deliveryForm} disabled={pending} />
          </section>
        )}

        {error && (
          <p role="alert" className="bg-white px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {loggedIn ? (
          <button
            type="button"
            onClick={checkout}
            disabled={pending || checking || hasProblem}
            className="inline-flex items-center justify-center rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {pending ? "Placing order…" : "Place order · Cash on delivery"}
          </button>
        ) : (
          <Link
            href="/login?next=%2Fcart"
            className="inline-flex items-center justify-center rounded-full bg-ink h-10 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] sm:h-12 sm:px-8 sm:text-base"
          >
            Log in to check out
          </Link>
        )}
        {hasProblem && <p className="text-center text-xs text-ink/70">Fix the highlighted items to check out.</p>}
      </aside>
    </div>
  );
}

function BagSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-5">
        <div className="h-9 w-40 animate-pulse bg-muted" />
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="aspect-[3/4] w-24 animate-pulse bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 animate-pulse bg-muted" />
              <div className="h-3 w-16 animate-pulse bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse bg-brand-cream" />
    </div>
  );
}
