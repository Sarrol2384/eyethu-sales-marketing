import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PropertyImageRow, PropertyRow } from "@/lib/supabase/types";

export type PropertyWithImages = PropertyRow & {
  property_images: PropertyImageRow[];
};

/**
 * Fetch a single property by slug. Returns null if not found OR not published
 * (the published filter is enforced by RLS; this is a defence-in-depth check).
 *
 * Anyone authenticated (admin) can see drafts too — RLS will return them and
 * we don't filter here, since admin preview links go through this same path.
 */
export async function getPropertyBySlug(
  slug: string,
): Promise<PropertyWithImages | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `*, property_images (
         id, property_id, image_url, alt_text, is_primary, display_order, created_at
       )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as PropertyRow & { property_images: PropertyImageRow[] };
  return {
    ...row,
    property_images: (row.property_images ?? []).sort(
      (a, b) => (a.is_primary === b.is_primary ? a.display_order - b.display_order : a.is_primary ? -1 : 1),
    ),
  };
}

export type PropertyFilters = {
  suburb?: string;
  propertyType?: PropertyRow["property_type"];
  bedroomsMin?: number;
  priceMin?: number;
  priceMax?: number;
  isGated?: boolean;
  search?: string;
};

export type PropertyListItem = Pick<
  PropertyRow,
  | "id"
  | "title"
  | "slug"
  | "price"
  | "suburb"
  | "city"
  | "province"
  | "property_type"
  | "bedrooms"
  | "bathrooms"
  | "garages"
  | "is_gated_community"
  | "published_at"
> & {
  primary_image_url: string | null;
};

/**
 * Fetch published properties for the homepage grid, with optional filters.
 */
export async function listPublishedProperties(
  filters: PropertyFilters = {},
  limit = 60,
): Promise<PropertyListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("properties")
    .select(
      `id, title, slug, price, suburb, city, province, property_type,
       bedrooms, bathrooms, garages, is_gated_community, published_at,
       property_images!inner ( image_url, is_primary, display_order )`,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (filters.suburb) query = query.ilike("suburb", filters.suburb);
  if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
  if (filters.bedroomsMin) query = query.gte("bedrooms", filters.bedroomsMin);
  if (filters.priceMin) query = query.gte("price", filters.priceMin);
  if (filters.priceMax) query = query.lte("price", filters.priceMax);
  if (filters.isGated) query = query.eq("is_gated_community", true);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${term},suburb.ilike.${term},gated_community_name.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];

  type RawRow = Omit<PropertyListItem, "primary_image_url"> & {
    property_images: Array<{
      image_url: string;
      is_primary: boolean;
      display_order: number;
    }>;
  };
  const rows = data as unknown as RawRow[];

  return rows.map((row) => {
    const images = row.property_images ?? [];
    const primary =
      images.find((i) => i.is_primary) ??
      images.slice().sort((a, b) => a.display_order - b.display_order)[0];
    const { property_images: _drop, ...rest } = row;
    void _drop;
    return { ...rest, primary_image_url: primary?.image_url ?? null };
  });
}

/** Distinct suburbs across published listings — drives the filter dropdown. */
export async function listPublishedSuburbs(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("suburb")
    .eq("status", "published");
  if (error || !data) return [];
  const rows = data as unknown as Array<{ suburb: string }>;
  return Array.from(new Set(rows.map((r) => r.suburb))).sort();
}
