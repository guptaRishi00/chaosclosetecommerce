"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from "lucide-react";
import { placeBagOrder, quoteBag, type QuotedLine } from "@/lib/actions/bag.actions";
import { useBag, useWishlist } from "@/lib/client-store";
import { MAX_ORDER_QUANTITY } from "@/lib/orders";
import { cn, formatINR } from "@/lib/utils";

type Props = {
  loggedIn: boolean;
  shipTo?: { name: string; address?: string; district?: string } | null;
};

export function BagView({ loggedIn, shipTo }: Props) {
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
    setError(null);
    startTransition(async () => {
      const res = await placeBagOrder(bag.lines.map(({ productId, size, quantity }) => ({ productId, size, quantity }))).catch(() => null);
      if (!res) {
        setError("Couldn't reach the store. Nothing was ordered, try again.");
        return;
      }
      if (!res.ok) {
        setError(res.message);
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
        <CircleCheck className="size-12 text-green-700" strokeWidth={1.5} aria-hidden />
        <h1 className="font-heading text-2xl font-extrabold uppercase">Order placed</h1>
        <p className="text-black/70">
          {placed} item{placed === 1 ? "" : "s"} on the way. Pay in cash when {placed === 1 ? "it arrives" : "they arrive"}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard#orders" className="inline-flex items-center bg-black h-9 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm font-bold tracking-wide text-white uppercase hover:bg-brand-red">
            View my orders
          </Link>
          <Link href="/" className="inline-flex items-center border border-black h-9 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm font-bold tracking-wide uppercase hover:bg-black hover:text-white">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  if (bag.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <ShoppingBag className="size-12 text-black/30" strokeWidth={1.25} aria-hidden />
        <h1 className="font-heading text-2xl font-extrabold uppercase">Your bag is empty</h1>
        <p className="text-black/60">Add pieces from a product page, or hover a product and use Quick add.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center bg-black h-9 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm font-bold tracking-wide text-white uppercase hover:bg-brand-red">
            Start shopping
          </Link>
          {wish.count > 0 && (
            <Link href="/wishlist" className="inline-flex items-center border border-black h-9 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm font-bold tracking-wide uppercase hover:bg-black hover:text-white">
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
        <div className="flex items-baseline justify-between gap-4 border-b border-black/15 pb-4">
          <h1 id="bag-heading" className="font-heading text-2xl font-extrabold uppercase sm:text-3xl">
            Your bag
          </h1>
          <p className="text-sm text-black/60">
            {bag.count} item{bag.count === 1 ? "" : "s"}
          </p>
        </div>

        <ul className="divide-y divide-black/10">
          {rows.map(({ line, quote, unit, gone, stock, problem }) => {
            const href = quote?.slug ? `/product/${quote.slug}` : `/product/${line.slug}`;
            const max = Math.max(1, Math.min(MAX_ORDER_QUANTITY, Number.isFinite(stock) ? stock : MAX_ORDER_QUANTITY));
            return (
              <li key={key(line.productId, line.size)} className="flex gap-3 py-5 sm:gap-5">
                <Link href={href} className={cn("relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-[#efe6d2] min-[380px]:w-24 sm:w-28", gone && "pointer-events-none opacity-50")}>
                  {(quote?.image ?? line.image) && <Image src={(quote?.image ?? line.image)!} alt="" fill sizes="112px" className="object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={href} className="line-clamp-2 text-sm font-bold tracking-wide uppercase hover:underline">
                        {quote?.name ?? line.name}
                      </Link>
                      <p className="mt-1 text-xs text-black/60">Size {line.size}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{gone ? "–" : formatINR(unit * line.quantity)}</p>
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
                      <div className="inline-flex h-8 items-center border border-black/25 sm:h-9" role="group" aria-label={`Quantity for ${line.name}, size ${line.size}`}>
                        <button
                          type="button"
                          onClick={() => bag.setQuantity(line.productId, line.size, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-full w-8 items-center sm:w-9 justify-center disabled:opacity-30"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <output className="w-7 text-center text-sm tabular-nums">{line.quantity}</output>
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
                      className="inline-flex h-8 items-center gap-1.5 px-1 text-xs sm:h-9 font-semibold text-black/60 hover:text-brand-red"
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

      <aside aria-labelledby="summary-heading" className="flex flex-col gap-5 border border-black/10 bg-white p-5 lg:sticky lg:top-24">
        <h2 id="summary-heading" className="text-sm font-bold tracking-wider uppercase">
          Order summary
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-black/60">Items ({itemCount})</dt>
            <dd className="tabular-nums">{checking ? "…" : formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-black/60">Delivery</dt>
            <dd>Free in Dibrugarh</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-black/60">Payment</dt>
            <dd>Cash on delivery</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{checking ? "…" : formatINR(subtotal)}</dd>
          </div>
        </dl>

        {loggedIn && shipTo && (
          <div className="border-t border-black/10 pt-4 text-sm">
            <p className="text-xs font-bold tracking-wider text-black/60 uppercase">Deliver to</p>
            <p className="mt-1 font-semibold">{shipTo.name}</p>
            <p className="whitespace-pre-line text-black/70">{[shipTo.address, shipTo.district].filter(Boolean).join(", ") || "No address on your account yet."}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="bg-brand-red/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {loggedIn ? (
          <button
            type="button"
            onClick={checkout}
            disabled={pending || checking || hasProblem}
            className="inline-flex items-center justify-center bg-brand-red h-10 px-4 text-xs sm:h-12 sm:px-6 sm:text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-black active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Placing order…" : "Place order · Cash on delivery"}
          </button>
        ) : (
          <Link
            href="/login?next=%2Fcart"
            className="inline-flex items-center justify-center bg-black h-10 px-4 text-xs sm:h-12 sm:px-6 sm:text-sm font-bold tracking-wide text-white uppercase hover:bg-brand-red"
          >
            Log in to check out
          </Link>
        )}
        {hasProblem && <p className="text-center text-xs text-black/60">Fix the highlighted items to check out.</p>}
      </aside>
    </div>
  );
}

function BagSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-5">
        <div className="h-9 w-40 animate-pulse bg-black/10" />
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="aspect-[3/4] w-24 animate-pulse bg-black/10" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 animate-pulse bg-black/10" />
              <div className="h-3 w-16 animate-pulse bg-black/10" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse bg-black/5" />
    </div>
  );
}
