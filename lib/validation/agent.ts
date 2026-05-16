import { z } from "zod";

export const createAgentFormSchema = z
  .object({
    display_name: z.string().trim().min(1, "Name is required").max(160),
    email: z.string().trim().email("Valid email required"),
    phone: z.string().trim().max(20).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string().min(1, "Confirm password"),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export type CreateAgentFormInput = z.infer<typeof createAgentFormSchema>;
