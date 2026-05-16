import { z } from "zod";
import { isSAPhone } from "@/lib/format/phone";

export const moveTimelineEnum = z.enum([
  "asap",
  "1_3_months",
  "3_6_months",
  "6_plus_months",
  "just_browsing",
]);

export type MoveTimelineValue = z.infer<typeof moveTimelineEnum>;

export const MOVE_TIMELINE_LABELS: Record<MoveTimelineValue, string> = {
  asap: "ASAP",
  "1_3_months": "In 1–3 months",
  "3_6_months": "In 3–6 months",
  "6_plus_months": "In 6+ months",
  just_browsing: "Just browsing",
};

/**
 * Shared between the lead form (client) and the /api/leads route (server).
 *
 * `hp_field` is a honeypot — bots that fill every visible-looking input will
 * populate it and we reject the request. Real users never see it.
 */
export const leadSubmissionSchema = z.object({
  property_id: z.string().uuid().nullable().optional(),
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter your phone number")
    .max(20, "Phone number is too long")
    .refine(isSAPhone, {
      message: "Use a SA number — e.g. 082 555 0123 or +27 82 555 0123",
    }),
  email: z
    .union([
      z.string().trim().email("Please enter a valid email"),
      z.literal(""),
    ])
    .optional(),
  message: z.string().trim().max(2000, "Message is too long").optional(),
  is_first_time_buyer: z.boolean().default(false),
  move_timeline: moveTimelineEnum.optional().nullable(),
  consent: z.literal(true, {
    message: "Please accept the privacy notice to continue",
  }),
  hp_field: z.string().max(0, "Bot detected").optional(),
  utm_source: z.string().max(120).optional().nullable(),
  utm_medium: z.string().max(120).optional().nullable(),
  utm_campaign: z.string().max(120).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  /** Agent user_id from the ?ref= share-link query param. */
  ref: z.string().uuid().optional().nullable(),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
