"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrors, idle, type ActionState, type FieldErrors } from "@/lib/validations/utils";

/**
 * Wraps a form Server Action with client-side validation using the SAME Zod schema
 * the action uses server-side. Invalid input never leaves the browser; valid input
 * is re-validated on the server, which remains the real gate.
 *
 * Submits via a transition instead of the native form action so React 19 doesn't
 * auto-reset the form when the server returns an error (it would wipe every field).
 * The form still has `action={formAction}`, so it works without JavaScript.
 */
export function useValidatedAction<T>(
  schema: z.ZodType,
  action: (prev: ActionState<T>, formData: FormData) => Promise<ActionState<T>>,
  {
    resetOnSuccess = false,
    toInput = (fd: FormData) => Object.fromEntries(fd),
  }: {
    resetOnSuccess?: boolean;
    /** FormData → schema input. Must match what the Server Action does (e.g. productFormToInput). */
    toInput?: (formData: FormData) => unknown;
  } = {},
) {
  const [state, formAction, actionPending] = useActionState(action, idle as ActionState<T>);
  const [transitionPending, startTransition] = useTransition();
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = schema.safeParse(toInput(formData));
    if (!result.success) {
      setClientErrors(fieldErrors(result.error));
      focusFirstInvalid(event.currentTarget, fieldErrors(result.error));
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  useEffect(() => {
    if (state.status === "success" && resetOnSuccess) formRef.current?.reset();
    if (state.status === "error" && state.fieldErrors && formRef.current) focusFirstInvalid(formRef.current, state.fieldErrors);
  }, [state, resetOnSuccess]);

  const errors = clientErrors ?? (state.status === "error" ? state.fieldErrors : undefined) ?? {};
  const message = state.status !== "idle" ? state.message : undefined;

  /** Props for a control + its shadcn <Field>/<FieldError>, keyed by the schema field name. */
  function field(name: string) {
    const error = errors[name]?.[0];
    return {
      error,
      errorId: `${name}-error`,
      invalid: Boolean(error),
      control: {
        id: name,
        name,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${name}-error` : undefined,
      },
    };
  }

  return { state, formAction, formRef, pending: actionPending || transitionPending, onSubmit, errors, message, field };
}

function focusFirstInvalid(form: HTMLFormElement, errors: FieldErrors) {
  const first = Object.keys(errors).find((k) => errors[k]?.length);
  if (!first) return;
  const el = form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]:not([type="hidden"]), #${CSS.escape(first)}`);
  el?.focus();
}
