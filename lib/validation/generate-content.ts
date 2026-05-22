import { z } from "zod";
import type { PropertyFormInput } from "@/lib/validation/property";
import { normalizeNumericInput } from "@/lib/validation/property";

function optionalNumber() {
  return z.preprocess(
    normalizeNumericInput,
    z.coerce.number().nonnegative().optional(),
  );
}

/** Request body for POST /api/generate-content — coerces form strings to numbers. */
export const generateContentRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is too short for AI generation")
    .max(200),
  propertyType: z.enum(["house", "townhouse", "apartment", "land"]),
  listingType: z.enum(["sale", "rent"]),
  price: z.preprocess(
    normalizeNumericInput,
    z.coerce
      .number({ error: "Enter a valid price before generating" })
      .nonnegative("Enter a valid price before generating"),
  ),
  suburb: z.string().trim().min(1, "Suburb is required").max(120),
  city: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120),
  isGatedCommunity: z.boolean(),
  gatedCommunityName: z.string().max(160).nullable().optional(),
  bedrooms: z.coerce.number().int().nonnegative().default(0),
  bathrooms: z.coerce.number().int().nonnegative().default(0),
  garages: z.coerce.number().int().nonnegative().default(0),
  parkingSpaces: z.coerce.number().int().nonnegative().default(0),
  floorSizeSqm: optionalNumber(),
  erfSizeSqm: optionalNumber(),
  yearBuilt: z.preprocess(
    normalizeNumericInput,
    z.coerce
      .number()
      .int()
      .min(1800, "Year must be 1800–2100")
      .max(2100, "Year must be 1800–2100")
      .optional(),
  ),
  features: z.array(z.string()).default([]),
  manualDescription: z.string().nullable().optional(),
});

export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>;

/** Map raw react-hook-form values to the generate-content API payload. */
export function buildGenerateContentRequest(
  values: PropertyFormInput,
): GenerateContentRequest {
  return {
    title: values.title,
    propertyType: values.property_type,
    listingType: values.listing_type,
    price: values.price,
    suburb: values.suburb,
    city: values.city,
    province: values.province,
    isGatedCommunity: values.is_gated_community,
    gatedCommunityName: values.gated_community_name?.trim() || null,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    garages: values.garages,
    parkingSpaces: values.parking_spaces,
    floorSizeSqm: values.floor_size_sqm,
    erfSizeSqm: values.erf_size_sqm,
    yearBuilt: values.year_built,
    features: values.features ?? [],
    manualDescription: values.manual_description?.trim() || null,
  };
}

export function firstZodIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check title, suburb, and price before generating.";
}
