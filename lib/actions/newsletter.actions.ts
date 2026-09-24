"use server";

import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validations/newsletter";
import { fieldErrors, type ActionState } from "@/lib/validations/utils";
import { SubscriberModel } from "@/models/Subscriber";

export async function subscribe(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`newsletter:${clientIp(await headers())}`, 5, 15 * 60_000).ok) {
    return { status: "error", message: "Too many attempts. Try again in a few minutes." };
  }
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  await connectDB();
  // Upsert on the unique email: re-subscribing is harmless. Same reply either way, so the form
  // can't be used to check whether someone's email is already subscribed.
  await SubscriberModel.updateOne({ email: parsed.data.email }, { $setOnInsert: { email: parsed.data.email } }, { upsert: true });
  return { status: "success", message: "You're on the list. New drops land in your inbox first." };
}
