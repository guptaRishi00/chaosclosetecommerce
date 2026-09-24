import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase().max(200),
});
