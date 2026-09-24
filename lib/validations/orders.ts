import { z } from "zod";
import { FULFILLMENT_VALUES, RETURN_REASON_VALUES } from "@/lib/orders";
import { optionalImageSchema } from "@/lib/validations/uploads";

// Admin → updateFulfillment. Shared by the order page form and the Server Action.
export const fulfillmentSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid order"),
    fulfillment: z.enum(FULFILLMENT_VALUES, { error: "Choose a delivery status" }),
    returnReason: z.enum(RETURN_REASON_VALUES).optional(),
    returnDescription: z.string().trim().max(1000, "Keep it under 1000 characters").optional().default(""),
    returnImage: optionalImageSchema,
    restock: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === "returned" && !v.returnReason) {
      ctx.addIssue({ code: "custom", path: ["returnReason"], message: "Choose why it was returned" });
    }
  });

export function fulfillmentFormToInput(formData: FormData) {
  return {
    id: formData.get("id"),
    fulfillment: formData.get("fulfillment") || undefined,
    returnReason: formData.get("returnReason") || undefined,
    returnDescription: formData.get("returnDescription") ?? "",
    returnImage: formData.get("returnImage") ?? undefined,
    restock: formData.get("restock") === "on",
  };
}
