"use client";

import { Lock } from "lucide-react";
import { register } from "@/lib/actions/auth.actions";
import { COUNTRY, GENDERS, registerSchema } from "@/lib/validations/auth";
import { Alert } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarPicker } from "./avatar-picker";
import { PasswordInput } from "./password-input";
import { useValidatedAction } from "./use-validated-action";

const legendClass = "mb-3 font-heading text-[11px] font-bold tracking-[0.2em] text-brand-red uppercase";

export function RegisterForm({ next }: { next?: string }) {
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(registerSchema, register);
  const f = {
    avatar: field("avatar"),
    name: field("name"),
    age: field("age"),
    gender: field("gender"),
    email: field("email"),
    password: field("password"),
    country: field("country"),
    district: field("district"),
    address: field("address"),
  };

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FieldGroup className="gap-6">
        {message && <Alert>{message}</Alert>}

        <FieldSet>
          <FieldLegend className={legendClass}>Profile</FieldLegend>
          <FieldGroup className="gap-4">
            <Field data-invalid={f.avatar.invalid}>
              <AvatarPicker {...f.avatar.control} />
              <FieldError id={f.avatar.errorId}>{f.avatar.error}</FieldError>
            </Field>
            <Field data-invalid={f.name.invalid}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input {...f.name.control} autoComplete="name" className="h-9" required />
              <FieldError id={f.name.errorId}>{f.name.error}</FieldError>
            </Field>
            <Field data-invalid={f.age.invalid} className="max-w-32">
              <FieldLabel htmlFor="age">Age</FieldLabel>
              <Input {...f.age.control} type="number" inputMode="numeric" min={13} max={120} className="h-9" required />
              <FieldError id={f.age.errorId}>{f.age.error}</FieldError>
            </Field>
            <FieldSet data-invalid={f.gender.invalid} aria-describedby={f.gender.invalid ? f.gender.errorId : undefined}>
              <FieldLegend variant="label">Gender</FieldLegend>
              <RadioGroup name="gender" aria-invalid={f.gender.invalid} className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <FieldLabel key={g.value} htmlFor={`gender-${g.value}`}>
                    <Field orientation="horizontal" className="py-2!">
                      <RadioGroupItem id={`gender-${g.value}`} value={g.value} />
                      <FieldTitle className="font-normal">{g.label}</FieldTitle>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <FieldError id={f.gender.errorId}>{f.gender.error}</FieldError>
            </FieldSet>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend className={legendClass}>Account</FieldLegend>
          <FieldGroup className="gap-4">
            <Field data-invalid={f.email.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input {...f.email.control} type="email" autoComplete="email" placeholder="you@example.com" className="h-9" required />
              <FieldError id={f.email.errorId}>{f.email.error}</FieldError>
            </Field>
            <Field data-invalid={f.password.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput {...f.password.control} autoComplete="new-password" className="h-9" required />
              {f.password.invalid ? (
                <FieldError id={f.password.errorId}>{f.password.error}</FieldError>
              ) : (
                <FieldDescription className="text-xs">At least 8 characters.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend className={legendClass}>Location</FieldLegend>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={f.country.invalid}>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                {/* readOnly (not disabled) so the value is still submitted; the server enforces it anyway */}
                <InputGroup className="h-9 bg-muted/40">
                  <InputGroupInput
                    {...f.country.control}
                    value={COUNTRY}
                    readOnly
                    aria-readonly
                    autoComplete="country-name"
                    className="h-full cursor-not-allowed font-medium"
                  />
                  <InputGroupAddon align="inline-end">
                    <Lock aria-hidden />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError id={f.country.errorId}>{f.country.error}</FieldError>
              </Field>
              <Field data-invalid={f.district.invalid}>
                <FieldLabel htmlFor="district">District</FieldLabel>
                <Input {...f.district.control} autoComplete="address-level2" placeholder="e.g. Dibrugarh" className="h-9" required />
                <FieldError id={f.district.errorId}>{f.district.error}</FieldError>
              </Field>
            </div>
            <FieldDescription className="-mt-2 text-xs">We currently ship only within India.</FieldDescription>
            <Field data-invalid={f.address.invalid}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea
                {...f.address.control}
                autoComplete="street-address"
                placeholder="House no., street, locality, landmark, PIN code"
                rows={3}
                className="min-h-20 resize-none"
                required
              />
              <FieldError id={f.address.errorId}>{f.address.error}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <SubmitButton pending={pending} pendingLabel="Creating account…" className="h-9 font-semibold sm:h-10">
          Create account
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
