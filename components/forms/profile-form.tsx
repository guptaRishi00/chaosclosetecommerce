"use client";

import Link from "next/link";
import { updateProfile } from "@/lib/actions/profile.actions";
import { GENDERS, profileSchema } from "@/lib/validations/auth";
import { Alert } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarPicker } from "./avatar-picker";
import { useValidatedAction } from "./use-validated-action";

export type ProfileDefaults = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  district: string;
  address: string;
  avatarUrl?: string;
};

const legendClass = "mb-3 text-lg font-semibold tracking-tight";

/** Same fields and rules as signup, minus email/password/country. On success the action redirects to /dashboard. */
export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(profileSchema, updateProfile);
  const f = {
    avatar: field("avatar"),
    name: field("name"),
    age: field("age"),
    gender: field("gender"),
    phone: field("phone"),
    district: field("district"),
    address: field("address"),
  };

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-6">
        {message && <Alert>{message}</Alert>}

        <FieldSet>
          <FieldLegend className={legendClass}>Profile</FieldLegend>
          <FieldGroup className="gap-4">
            <Field data-invalid={f.avatar.invalid}>
              <AvatarPicker {...f.avatar.control} initialUrl={defaults.avatarUrl} />
              <FieldError id={f.avatar.errorId}>{f.avatar.error}</FieldError>
            </Field>
            {defaults.avatarUrl && (
              <Field orientation="horizontal">
                <Checkbox id="removeAvatar" name="removeAvatar" />
                <FieldContent>
                  <FieldLabel htmlFor="removeAvatar" className="font-normal">
                    Remove my current photo
                  </FieldLabel>
                  <FieldDescription className="text-xs">Ignored if you pick a new photo above.</FieldDescription>
                </FieldContent>
              </Field>
            )}
            <Field data-invalid={f.name.invalid}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input {...f.name.control} defaultValue={defaults.name} autoComplete="name" className="h-10 sm:h-11" required />
              <FieldError id={f.name.errorId}>{f.name.error}</FieldError>
            </Field>
            <Field data-invalid={f.age.invalid} className="max-w-32">
              <FieldLabel htmlFor="age">Age</FieldLabel>
              <Input {...f.age.control} defaultValue={defaults.age} type="number" inputMode="numeric" min={13} max={120} className="h-10 sm:h-11" required />
              <FieldError id={f.age.errorId}>{f.age.error}</FieldError>
            </Field>
            <FieldSet data-invalid={f.gender.invalid} aria-describedby={f.gender.invalid ? f.gender.errorId : undefined}>
              <FieldLegend variant="label">Gender</FieldLegend>
              <RadioGroup name="gender" defaultValue={defaults.gender || undefined} aria-invalid={f.gender.invalid} className="grid grid-cols-2 gap-2">
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
          <FieldLegend className={legendClass}>Contact</FieldLegend>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="email-readonly">Email</FieldLabel>
              <Input id="email-readonly" value={defaults.email} readOnly aria-readonly className="h-10 cursor-not-allowed bg-muted/60 sm:h-11" />
              <FieldDescription className="text-xs">Your email is your login and can&apos;t be changed here.</FieldDescription>
            </Field>
            <Field data-invalid={f.phone.invalid}>
              <FieldLabel htmlFor="phone">
                Mobile number <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input {...f.phone.control} defaultValue={defaults.phone} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="10-digit mobile" className="h-10 sm:h-11" />
              {f.phone.invalid ? (
                <FieldError id={f.phone.errorId}>{f.phone.error}</FieldError>
              ) : (
                <FieldDescription className="text-xs">We fill it in for you at checkout.</FieldDescription>
              )}
            </Field>
            <Field data-invalid={f.district.invalid}>
              <FieldLabel htmlFor="district">District</FieldLabel>
              <Input {...f.district.control} defaultValue={defaults.district} autoComplete="address-level2" placeholder="e.g. Dibrugarh" className="h-10 sm:h-11" required />
              <FieldError id={f.district.errorId}>{f.district.error}</FieldError>
            </Field>
            <Field data-invalid={f.address.invalid}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea
                {...f.address.control}
                defaultValue={defaults.address}
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand-cream px-6 text-sm font-semibold transition-colors hover:bg-ink hover:text-white active:scale-[0.98] sm:h-12 sm:text-base"
          >
            Cancel
          </Link>
          <SubmitButton pending={pending} pendingLabel="Saving…" className="h-10 rounded-full px-8 text-sm font-semibold active:scale-[0.98] sm:h-12 sm:text-base">
            Save changes
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
