"use client";

import { useState, useTransition } from "react";
import { placeOrder, type PlaceOrderResult } from "@/lib/actions/checkout.actions";
import { Button } from "@/components/ui/button";

/** Places a cash-on-delivery order for one size. For the storefront product page (not built yet). */
export function BuyButton({ productId, size, quantity = 1 }: { productId: string; size: string; quantity?: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PlaceOrderResult | null>(null);

  function onClick() {
    startTransition(async () => {
      setResult(await placeOrder({ productId, size, quantity }));
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={onClick} disabled={pending}>
        {pending ? "Placing order…" : "Order · Cash on delivery"}
      </Button>
      <p aria-live="polite" className="text-xs text-foreground/60">
        {result && (result.ok ? "Order placed — pay in cash when it arrives." : result.message)}
      </p>
    </div>
  );
}
