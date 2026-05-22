import { z } from "zod";

/** Blank or spaced numeric strings → undefined; strips SA thousand separators. */
export function normalizeNumericInput(val: unknown): unknown {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "string") {
    const cleaned = val.trim().replace(/\s/g, "").replace(/,/g, "");
    if (cleaned === "") return undefined;
    return cleaned;
  }
  return val;
}

function optionalNonNegativeNumber(invalidMessage = "Enter a valid number") {
  return z.preprocess(
    normalizeNumericInput,
    z.coerce
      .number({ error: invalidMessage })
      .nonnegative(invalidMessage)
      .optional(),
  );
}

function requiredNonNegativeNumber(invalidMessage = "Enter a valid price") {
  return z.preprocess(
    normalizeNumericInput,
    z.coerce
      .number({ error: invalidMessage })
      .nonnegative("Price must be 0 or more"),
  );
}

export const propertyTypeEnum = z.enum([
  "house",
  "townhouse",
  "apartment",
  "land",
]);
export const listingTypeEnum = z.enum(["sale", "rent"]);
export const propertyStatusEnum = z.enum(["draft", "published", "sold"]);

/** Schema for the create/update property form. */
export const propertyFormSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(200),
  property_type: propertyTypeEnum,
  listing_type: listingTypeEnum,
  status: propertyStatusEnum.default("draft"),
  price: requiredNonNegativeNumber(),

  address: z.string().trim().max(300).optional(),
  suburb: z.string().trim().min(2, "Suburb is required").max(120),
  city: z.string().trim().min(2).max(120).default("Cape Town"),
  province: z.string().trim().min(2).max(120).default("Western Cape"),

  is_gated_community: z.boolean().default(false),
  gated_community_name: z.string().trim().max(160).optional(),

  bedrooms: z.coerce.number().int().nonnegative().default(0),
  bathrooms: z.coerce.number().int().nonnegative().default(0),
  garages: z.coerce.number().int().nonnegative().default(0),
  parking_spaces: z.coerce.number().int().nonnegative().default(0),

  floor_size_sqm: optionalNonNegativeNumber(),
  erf_size_sqm: optionalNonNegativeNumber(),
  year_built: z.preprocess(
    normalizeNumericInput,
    z.coerce
      .number()
      .int()
      .min(1800, "Year must be 1800–2100")
      .max(2100, "Year must be 1800–2100")
      .optional(),
  ),

  features: z.array(z.string().trim().min(1)).default([]),

  manual_description: z.string().trim().max(4000).optional(),
  ai_description: z.string().trim().max(4000).optional(),
  ai_seo_title: z.string().trim().max(200).optional(),
  ai_seo_description: z.string().trim().max(300).optional(),
  ai_neighbourhood_summary: z.string().trim().max(2000).optional(),
  ai_headline: z.string().trim().max(120).optional(),
  ai_cta: z.string().trim().max(60).optional(),

  agent_name: z.string().trim().max(120).optional(),
  agent_phone: z.string().trim().max(20).optional(),
  agent_email: z
    .union([z.string().trim().email(), z.literal("")])
    .optional(),
  agent_photo_url: z.string().trim().url().optional().or(z.literal("")),

  /** Admin-only: login email of the agent who should manage this listing in /agent */
  assigned_agent_email: z
    .union([z.string().trim().email(), z.literal("")])
    .optional(),

  /** Admin-only: assign by agent_accounts.user_id (preferred when set) */
  assigned_user_id: z
    .union([z.string().uuid(), z.literal("")])
    .optional(),

  /** Admin-only: agent who brought / mandated the listing */
  sourced_by_user_id: z
    .union([z.string().uuid(), z.literal("")])
    .optional(),

  /** Admin-only: override commission % of sale price */
  commission_percent: z
    .union([
      z.literal(""),
      z.coerce.number().min(0, "Must be 0–100").max(100, "Must be 0–100"),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),

  /** Admin-only: fixed commission in ZAR (overrides %) */
  commission_amount: z
    .union([z.literal(""), z.coerce.number().nonnegative()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),

  /** Admin-only: final sale price when status is sold */
  sold_price: z
    .union([z.literal(""), z.coerce.number().nonnegative()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;

/** Predefined feature options that appear in the multi-select. */
export const FEATURE_OPTIONS = [
  "alarm system",
  "armed response",
  "boundary wall",
  "electric fence",
  "cctv",
  "prepaid electricity",
  "solar / inverter",
  "fibre ready",
  "borehole",
  "swimming pool",
  "garden",
  "braai area",
  "patio",
  "scullery",
  "study",
  "domestic quarters",
  "tiled throughout",
  "wooden floors",
  "aircon",
  "fireplace",
  "pet friendly",
] as const;
