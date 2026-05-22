import type { PropertyFormInput } from "@/lib/validation/property";
import type { PropertyImageRow, PropertyRow } from "@/lib/supabase/types";

function finiteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Avoid passing invalid URLs to next/image on the edit form. */
export function safeImageUrl(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    // ignore
  }
  return "";
}

export function buildPropertyFormInitial(
  row: PropertyRow,
  options?: { assignedAgentEmail?: string },
): Partial<PropertyFormInput> {
  const price = finiteNumber(row.price) ?? 0;

  return {
    title: row.title,
    property_type: row.property_type,
    listing_type: row.listing_type,
    status: row.status,
    price,
    address: row.address ?? "",
    suburb: row.suburb,
    city: row.city,
    province: row.province,
    is_gated_community: row.is_gated_community,
    gated_community_name: row.gated_community_name ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    garages: row.garages,
    parking_spaces: row.parking_spaces,
    floor_size_sqm: finiteNumber(row.floor_size_sqm),
    erf_size_sqm: finiteNumber(row.erf_size_sqm),
    year_built: row.year_built ?? undefined,
    features: Array.isArray(row.features) ? row.features : [],
    manual_description: row.manual_description ?? "",
    ai_description: row.ai_description ?? "",
    ai_seo_title: row.ai_seo_title ?? "",
    ai_seo_description: row.ai_seo_description ?? "",
    ai_neighbourhood_summary: row.ai_neighbourhood_summary ?? "",
    ai_headline: row.ai_headline ?? "",
    ai_cta: row.ai_cta ?? "",
    agent_name: row.agent_name ?? "",
    agent_phone: row.agent_phone ?? "",
    agent_email: row.agent_email ?? "",
    agent_photo_url: safeImageUrl(row.agent_photo_url),
    assigned_agent_email: options?.assignedAgentEmail ?? "",
    assigned_user_id: row.assigned_user_id ?? "",
    sourced_by_user_id: row.sourced_by_user_id ?? "",
    commission_percent: finiteNumber(row.commission_percent),
    commission_amount: finiteNumber(row.commission_amount),
    sold_price: finiteNumber(row.sold_price),
  };
}

export function mapPropertyImagesForForm(images: PropertyImageRow[]) {
  return images
    .filter((img) => safeImageUrl(img.image_url).length > 0)
    .map((img) => ({
      id: img.id,
      image_url: img.image_url,
      is_primary: img.is_primary,
      display_order: img.display_order,
    }));
}
