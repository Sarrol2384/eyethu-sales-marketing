import { NextResponse } from "next/server";
import {
  listPublishedProperties,
  type PropertyFilters,
} from "@/lib/properties/queries";
import type { PropertyRow } from "@/lib/supabase/types";

const ALLOWED_TYPES: PropertyRow["property_type"][] = [
  "house",
  "townhouse",
  "apartment",
  "land",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: PropertyFilters = {};

  const suburb = searchParams.get("suburb");
  if (suburb) filters.suburb = suburb;

  const type = searchParams.get("type");
  if (
    type &&
    (ALLOWED_TYPES as readonly string[]).includes(type)
  ) {
    filters.propertyType = type as PropertyRow["property_type"];
  }

  const beds = Number(searchParams.get("beds"));
  if (Number.isFinite(beds) && beds > 0) filters.bedroomsMin = beds;

  const priceMin = Number(searchParams.get("price_min"));
  if (Number.isFinite(priceMin) && priceMin > 0) filters.priceMin = priceMin;

  const priceMax = Number(searchParams.get("price_max"));
  if (Number.isFinite(priceMax) && priceMax > 0) filters.priceMax = priceMax;

  if (searchParams.get("gated") === "true") filters.isGated = true;

  const search = searchParams.get("q");
  if (search && search.length > 0 && search.length < 100) {
    filters.search = search;
  }

  const properties = await listPublishedProperties(filters);

  return NextResponse.json(
    { properties },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=300",
      },
    },
  );
}
