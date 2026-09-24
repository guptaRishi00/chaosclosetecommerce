import { z } from "zod";
import { optionalImageSchema } from "@/lib/validations/uploads";

// Shared by the client forms (instant feedback) and the Server Actions (the actual gate).

export const COUNTRY = "India" as const; // we only ship within India; the field is fixed in the UI and enforced here

export const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;

const genderValues = GENDERS.map((g) => g.value) as [
  (typeof GENDERS)[number]["value"],
  ...(typeof GENDERS)[number]["value"][],
];

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  country: z.literal(COUNTRY, { error: `We currently ship only within ${COUNTRY}` }),
  address: z.string().trim().min(5, "Enter your full address").max(200),
  district: z.string().trim().min(2, "Enter your district").max(60),
  // "" → undefined first, otherwise coerce turns an empty field into 0 and says "must be at least 13"
  age: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce
      .number({ error: "Enter your age" })
      .int("Age must be a whole number")
      .min(13, "You must be at least 13")
      .max(120, "Enter a valid age"),
  ),
  gender: z.enum(genderValues, { error: "Select an option" }),
  avatar: optionalImageSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type Gender = (typeof genderValues)[number];
