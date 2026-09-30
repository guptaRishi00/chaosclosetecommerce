"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleX } from "lucide-react";
import { cancelMyOrder } from "@/lib/actions/checkout.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** "Cancel order" on My orders, confirmed in a dialog. Only rendered for orders not yet delivered. */
export function CancelOrderButton({ orderId, summary }: { orderId: string; summary: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await cancelMyOrder(orderId).catch(() => ({ ok: false as const, message: "Couldn't reach the store. Try again." }));
      if (!res.ok) {
        setError(res.message); // refreshed when the dialog closes, so the message stays readable
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next && error) router.refresh(); // it may have been delivered meanwhile: show the real status
        setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        {/* Phones: 40px icon circle (label stays for screen readers). sm+: quiet ghost pill with icon + label. */}
        <button
          type="button"
          title="Cancel order"
          className="inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full text-ink/60 ring-1 ring-ink/15 transition-colors hover:text-brand-red hover:ring-brand-red/40 active:scale-95 sm:size-auto sm:h-9 sm:px-3.5 sm:text-sm sm:font-semibold"
        >
          <CircleX className="size-[18px] sm:size-4" strokeWidth={1.75} aria-hidden />
          <span className="sr-only sm:not-sr-only">Cancel order</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-none p-6 data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold tracking-tight">Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ink/70">
            {summary}. It won&apos;t be delivered and you won&apos;t pay anything. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="bg-brand-red/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={pending} className="h-10 rounded-full border-0 bg-brand-cream px-5 font-semibold hover:bg-ink hover:text-white">
            Keep order
          </AlertDialogCancel>
          {/* Plain button (not AlertDialogAction) so the dialog stays open to show an error */}
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Cancelling…" : "Cancel order"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
