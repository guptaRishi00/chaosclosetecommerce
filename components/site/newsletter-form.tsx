"use client";

import { ArrowRight } from "lucide-react";
import { subscribe } from "@/lib/actions/newsletter.actions";
import { newsletterSchema } from "@/lib/validations/newsletter";
import { useValidatedAction } from "@/components/forms/use-validated-action";

export function NewsletterForm() {
  const { formAction, formRef, pending, onSubmit, message, field } = useValidatedAction(newsletterSchema, subscribe, {
    resetOnSuccess: true,
  });
  const email = field("email");

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="flex w-full max-w-md flex-col gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex h-11 w-full border-b-2 sm:h-12 border-white focus-within:border-brand-cream">
        <input
          {...email.control}
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/70 outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-2 px-1 text-xs font-bold sm:text-sm tracking-wide text-white uppercase hover:text-brand-cream disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join"}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <p aria-live="polite" id={email.errorId} className="min-h-5 text-sm text-white">
        {email.error ?? message}
      </p>
    </form>
  );
}
