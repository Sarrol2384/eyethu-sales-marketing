import { z } from "zod";
import { isSAPhone } from "@/lib/format/phone";

const optionalPercent = z
  .union([
    z.literal(""),
    z.coerce.number().min(0, "Must be 0–100").max(100, "Must be 0–100"),
  ])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

const optionalMoney = z
  .union([z.literal(""), z.coerce.number().nonnegative()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

export const createAgentFormSchema = z
  .object({
    display_name: z.string().trim().min(1, "Name is required").max(160),
    email: z.string().trim().email("Valid email required"),
    phone: z.string().trim().max(20).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string().min(1, "Confirm password"),
    default_commission_percent: optionalPercent,
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export type CreateAgentFormInput = z.infer<typeof createAgentFormSchema>;

export const updateAgentCommissionSchema = z.object({
  user_id: z.string().uuid(),
  default_commission_percent: z
    .number()
    .min(0, "Must be 0–100")
    .max(100, "Must be 0–100")
    .nullable(),
});

export type UpdateAgentCommissionInput = z.infer<
  typeof updateAgentCommissionSchema
>;

export const updateAgentProfileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().trim().min(1, "Name is required").max(160),
  email: z.string().trim().email("Valid email required"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || isSAPhone(v), {
      message: "Use a valid SA number (+27 or 0XX)",
    }),
});

export type UpdateAgentProfileInput = z.infer<typeof updateAgentProfileSchema>;