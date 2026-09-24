"use client";

import { login } from "@/lib/actions/auth.actions";
import { loginSchema } from "@/lib/validations/auth";
import { Alert } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "./password-input";
import { useValidatedAction } from "./use-validated-action";

export function LoginForm({ next }: { next?: string }) {
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(loginSchema, login);
  const email = field("email");
  const password = field("password");

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FieldGroup className="gap-4">
        {message && <Alert>{message}</Alert>}
        <Field data-invalid={email.invalid}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input {...email.control} type="email" autoComplete="email" placeholder="you@example.com" className="h-9" required />
          <FieldError id={email.errorId}>{email.error}</FieldError>
        </Field>
        <Field data-invalid={password.invalid}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput {...password.control} autoComplete="current-password" className="h-9" required />
          <FieldError id={password.errorId}>{password.error}</FieldError>
        </Field>
        <SubmitButton pending={pending} pendingLabel="Logging in…" className="mt-2 h-9 font-semibold sm:h-10">
          Log in
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
