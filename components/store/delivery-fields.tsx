"use client";

import { useState } from "react";
import type { DeliveryDefaults } from "@/lib/delivery";
import { deliverySchema, type DeliveryInput } from "@/lib/validations/checkout";
import { fieldErrors, type FieldErrors } from "@/lib/validations/utils";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Key = keyof DeliveryInput;

/**
 * Controlled delivery-details state for a checkout. `validate()` runs the same schema the order
 * actions use; the server re-validates and may hand back `fieldErrors` via `setServerErrors`.
 */
export function useDeliveryForm(defaults: DeliveryDefaults | null, idPrefix: string) {
  const [value, setValue] = useState<Record<Key, string>>({
    house: defaults?.house ?? "",
    area: defaults?.area ?? "",
    landmark: defaults?.landmark ?? "",
    district: defaults?.district ?? "",
    phone: defaults?.phone ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): DeliveryInput | null {
    const res = deliverySchema.safeParse(value);
    if (res.success) {
      setErrors({});
      return value;
    }
    const errs = fieldErrors(res.error);
    setErrors(errs);
    const first = FIELDS.find((f) => errs[f.key]?.length);
    if (first) document.getElementById(`${idPrefix}-${first.key}`)?.focus();
    return null;
  }

  return {
    value,
    errors,
    idPrefix,
    name: defaults?.name,
    set: (key: Key, v: string) => {
      setValue((cur) => ({ ...cur, [key]: v }));
      setErrors((cur) => (cur[key] ? { ...cur, [key]: undefined } : cur)); // clear a field's error as it's fixed
    },
    validate,
    setServerErrors: (errs?: FieldErrors) => errs && setErrors(errs),
  };
}

const FIELDS: { key: Key; label: string; autoComplete: string; placeholder?: string; optional?: boolean; type?: string; inputMode?: "tel" }[] = [
  { key: "house", label: "House / flat no.", autoComplete: "address-line1", placeholder: "e.g. House 12, 2nd floor" },
  { key: "area", label: "Street, area or locality", autoComplete: "address-line2", placeholder: "e.g. Amolapatty, Near AT Road" },
  { key: "landmark", label: "Landmark", autoComplete: "off", placeholder: "e.g. Opposite City Park", optional: true },
  { key: "district", label: "District", autoComplete: "address-level2", placeholder: "e.g. Dibrugarh" },
  { key: "phone", label: "Mobile number", autoComplete: "tel-national", placeholder: "10-digit mobile", type: "tel", inputMode: "tel" },
];

/** The delivery-details fields. Labels above inputs, errors below, landmark optional. */
export function DeliveryFields({ form, disabled }: { form: ReturnType<typeof useDeliveryForm>; disabled?: boolean }) {
  return (
    <FieldGroup className="gap-4">
      {form.name && <p className="text-sm text-ink/70">Delivering to {form.name}</p>}
      {FIELDS.map((f) => {
        const id = `${form.idPrefix}-${f.key}`;
        const error = form.errors[f.key]?.[0];
        return (
          <Field key={f.key} data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>
              {f.label}
              {f.optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </FieldLabel>
            <Input
              id={id}
              name={f.key}
              value={form.value[f.key]}
              onChange={(e) => form.set(f.key, e.target.value)}
              type={f.type ?? "text"}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              required={!f.optional}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : f.key === "phone" ? `${id}-hint` : undefined}
              className="h-10 bg-white sm:h-11"
            />
            {error ? (
              <FieldError id={`${id}-error`}>{error}</FieldError>
            ) : (
              f.key === "phone" && (
                <FieldDescription id={`${id}-hint`} className="text-xs">
                  The delivery partner calls this number.
                </FieldDescription>
              )
            )}
          </Field>
        );
      })}
    </FieldGroup>
  );
}
