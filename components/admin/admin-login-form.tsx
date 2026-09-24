"use client";

import { adminLogin } from "@/lib/actions/auth.actions";
import { loginSchema } from "@/lib/validations/auth";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/forms/password-input";
import { useValidatedAction } from "@/components/forms/use-validated-action";

export function AdminLoginForm({ next }: { next?: string }) {
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(loginSchema, adminLogin);
  const email = field("email");
  const password = field("password");

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FieldGroup className="gap-4">
        {message && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {message}
          </p>
        )}
        <Field data-invalid={email.invalid}>
          <FieldLabel htmlFor="email" className="text-muted-foreground">
            Email
          </FieldLabel>
          <Input {...email.control} type="email" autoComplete="username" className="h-10 bg-background" required />
          <FieldError id={email.errorId}>{email.error}</FieldError>
        </Field>
        <Field data-invalid={password.invalid}>
          <FieldLabel htmlFor="password" className="text-muted-foreground">
            Password
          </FieldLabel>
          <PasswordInput {...password.control} autoComplete="current-password" className="h-10 bg-background" required />
          <FieldError id={password.errorId}>{password.error}</FieldError>
        </Field>
        <SubmitButton pending={pending} pendingLabel="Signing in…" className="mt-1 h-10 font-medium">
          Continue
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
