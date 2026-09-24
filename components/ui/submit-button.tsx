"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Submit button that disables itself while its form is submitting. Pass `pending`
 * when the form submits via a transition (useValidatedAction), since useFormStatus
 * only tracks native form-action submissions.
 */
export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
  );
}
