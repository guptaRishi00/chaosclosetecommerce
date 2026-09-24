"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { updateFulfillment } from "@/lib/actions/orders.actions";
import { FULFILLMENT_STATUSES, RETURN_REASONS, type FulfillmentStatus } from "@/lib/orders";
import { fulfillmentFormToInput, fulfillmentSchema } from "@/lib/validations/orders";
import { IMAGE_TYPES } from "@/lib/validations/uploads";
import { useValidatedAction } from "@/components/forms/use-validated-action";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

const STATUS_HINT: Record<FulfillmentStatus, string> = {
  "not-delivered": "Placed, not yet with the customer (cash still to collect).",
  delivered: "Received and cash collected.",
  returned: "Sent back by the customer.",
};

export type FulfillmentInitial = {
  id: string;
  fulfillment: FulfillmentStatus;
  returnReason?: string;
  returnDescription?: string;
  returnImageUrl?: string;
  /** Stock was taken for this order and hasn't been put back yet. */
  canRestock: boolean;
  alreadyRestocked: boolean;
  quantity: number;
  size: string;
};

export function FulfillmentForm({ initial }: { initial: FulfillmentInitial }) {
  const { state, formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(fulfillmentSchema, updateFulfillment, {
    toInput: fulfillmentFormToInput,
  });
  const [status, setStatus] = useState<FulfillmentStatus>(initial.fulfillment);
  const [reason, setReason] = useState(initial.returnReason ?? "");
  const statusField = field("fulfillment");
  const reasonField = field("returnReason");
  const descField = field("returnDescription");
  const imageField = field("returnImage");

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="id" value={initial.id} />
      <FieldGroup className="gap-6">
        {message && (
          <p
            role={state.status === "success" ? "status" : "alert"}
            className={
              state.status === "success"
                ? "rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
                : "rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            }
          >
            {message}
          </p>
        )}

        <FieldSet data-invalid={statusField.invalid}>
          <FieldLegend variant="label">Status</FieldLegend>
          <RadioGroup
            name="fulfillment"
            value={status}
            onValueChange={(v) => setStatus(v as FulfillmentStatus)}
            className="grid gap-2 sm:grid-cols-3"
          >
            {FULFILLMENT_STATUSES.map((s) => (
              <FieldLabel key={s.value} htmlFor={`fulfillment-${s.value}`}>
                <Field orientation="horizontal">
                  <RadioGroupItem id={`fulfillment-${s.value}`} value={s.value} />
                  <FieldContent>
                    <FieldTitle>{s.label}</FieldTitle>
                    <FieldDescription className="text-xs">{STATUS_HINT[s.value]}</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          <FieldError id={statusField.errorId}>{statusField.error}</FieldError>
        </FieldSet>

        {status === "returned" && (
          <div className="flex flex-col gap-5 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <Field data-invalid={reasonField.invalid}>
              <FieldLabel htmlFor="returnReason">Why was it returned?</FieldLabel>
              <Select name="returnReason" value={reason} onValueChange={setReason}>
                <SelectTrigger
                  id="returnReason"
                  aria-invalid={reasonField.invalid}
                  aria-describedby={reasonField.control["aria-describedby"]}
                  className="h-9! w-full bg-background sm:w-72"
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id={reasonField.errorId}>{reasonField.error}</FieldError>
            </Field>

            <Field data-invalid={descField.invalid}>
              <FieldLabel htmlFor="returnDescription">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Textarea
                {...descField.control}
                defaultValue={initial.returnDescription}
                rows={3}
                placeholder="What the customer said, condition of the item…"
                className="min-h-20 bg-background"
              />
              <FieldError id={descField.errorId}>{descField.error}</FieldError>
            </Field>

            <Field data-invalid={imageField.invalid}>
              <FieldLabel htmlFor="returnImage">
                Photo <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <ReturnPhoto
                existingUrl={initial.returnImageUrl}
                invalid={imageField.invalid}
                describedBy={imageField.control["aria-describedby"]}
              />
              <FieldError id={imageField.errorId}>{imageField.error}</FieldError>
            </Field>

            <Field orientation="horizontal" data-disabled={!initial.canRestock || undefined}>
              <Checkbox id="restock" name="restock" disabled={!initial.canRestock} defaultChecked={initial.canRestock} />
              <FieldContent>
                <FieldLabel htmlFor="restock" className="font-normal">
                  Add {initial.quantity} × {initial.size} back to stock
                </FieldLabel>
                <FieldDescription className="text-xs">
                  {initial.alreadyRestocked
                    ? "Already added back to stock — this only happens once."
                    : initial.canRestock
                      ? "Untick if the item can't be resold (e.g. damaged)."
                      : "Stock was never taken for this order, so there's nothing to put back."}
                </FieldDescription>
              </FieldContent>
            </Field>
          </div>
        )}

        <div className="flex justify-end">
          <SubmitButton pending={pending} pendingLabel="Saving…" className="h-9 px-4 font-medium">
            Save
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}

function ReturnPhoto({ existingUrl, invalid, describedBy }: { existingUrl?: string; invalid: boolean; describedBy?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function pick(file: File | undefined) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(urlRef.current);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    pick(undefined);
  }

  const shown = preview ?? existingUrl;

  return (
    <div className="flex items-start gap-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-md border border-border bg-background">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: preview or small Cloudinary thumb
          <img src={shown} alt="Return photo" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImagePlus className="size-5" />
          </div>
        )}
        {preview && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove selected photo"
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded bg-black/70 text-white hover:bg-black"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="returnImage"
          className="inline-flex h-8 w-fit cursor-pointer items-center rounded-md border border-border bg-background px-3 text-sm transition-colors hover:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
        >
          {shown ? "Replace photo" : "Upload photo"}
          <input
            ref={inputRef}
            id="returnImage"
            name="returnImage"
            type="file"
            accept={Object.keys(IMAGE_TYPES).join(",")}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
      </div>
    </div>
  );
}
