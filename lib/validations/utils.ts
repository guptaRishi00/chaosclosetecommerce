import { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

/** Result shape returned by every form Server Action (consumed by useActionState). */
export type ActionState<T = undefined> =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: FieldErrors }
  | { status: "success"; message?: string; data?: T };

export const idle: ActionState<never> = { status: "idle" };

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
