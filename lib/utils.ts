export { cn } from "cn";

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

/** Whole-percent saving of `price` against the cut price, rounded DOWN so it never overstates. 0 = no discount. */
export function discountPercent(price: number, compareAtPrice?: number | null): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}

// The store runs on IST; pin the zone so a UTC server (e.g. Vercel) doesn't shift dates/times by 5.5 h.
const STORE_TZ = "Asia/Kolkata";
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: STORE_TZ });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: STORE_TZ });

/** "1 Oct 2026" in IST. */
export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

/** "3:45 pm" in IST. */
export function formatTime(d: Date): string {
  return timeFmt.format(d);
}
