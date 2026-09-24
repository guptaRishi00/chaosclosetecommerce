// Order vocabulary shared by the admin UI, validation and model. Safe on client and server.

// Cash on delivery only: "pending" = to collect, "paid" = cash collected (set when marked delivered).
export const PAYMENT_METHOD = "cod" as const;
export const PAYMENT_STATUSES = ["pending", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  { value: "not-delivered", label: "Not delivered" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]["value"];
export const FULFILLMENT_VALUES = FULFILLMENT_STATUSES.map((s) => s.value) as [FulfillmentStatus, ...FulfillmentStatus[]];

export const RETURN_REASONS = [
  { value: "wrong-size", label: "Wrong size / fit" },
  { value: "damaged", label: "Damaged or defective" },
  { value: "not-as-described", label: "Not as described" },
  { value: "wrong-item", label: "Wrong item sent" },
  { value: "changed-mind", label: "Changed mind" },
  { value: "other", label: "Other" },
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number]["value"];
export const RETURN_REASON_VALUES = RETURN_REASONS.map((r) => r.value) as [ReturnReason, ...ReturnReason[]];

export const MAX_ORDER_QUANTITY = 10;

export function fulfillmentLabel(value: string): string {
  return FULFILLMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function returnReasonLabel(value: string): string {
  return RETURN_REASONS.find((r) => r.value === value)?.label ?? value;
}
