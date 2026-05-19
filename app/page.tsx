import { Suspense } from "react";
import { Home } from "lucide-react";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { FilterBar } from "@/components/home/FilterBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import {
  listPublishedProperties,
  listPublishedSuburbs,
  type PropertyFilters,
} from "@/lib/properties/queries";
import type { PropertyRow } from "@/lib/supabase/types";

const ALLOWED_TYPES: PropertyRow["property_type"][] = [
  "house",
  "townhouse",
  "apartment",
  "land",
];

type SearchParams = Promise<{
  q?: string;
  suburb?: string;
  type?: string;
  beds?: string;
  price_min?: string;
  price_max?: string;
  gated?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const filters: PropertyFilters = {};
  if (sp.suburb) filters.suburb = sp.suburb;
  if (sp.type && (ALLOWED_TYPES as readonly string[]).includes(sp.type)) {
    filters.propertyType = sp.type as PropertyRow["property_type"];
  }
  const beds = Number(sp.beds);
  if (Number.isFinite(beds) && beds > 0) filters.bedroomsMin = beds;
  const priceMin = Number(sp.price_min);
  if (Number.isFinite(priceMin) && priceMin > 0) filters.priceMin = priceMin;
  const priceMax = Number(sp.price_max);
  if (Number.isFinite(priceMax) && priceMax > 0) filters.priceMax = priceMax;
  if (sp.gated === "true") filters.isGated = true;
  if (sp.q) filters.search = sp.q;

  const [properties, suburbs] = await Promise.all([
    listPublishedProperties(filters),
    listPublishedSuburbs(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Find your first home
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Affordable houses, townhouses and apartments across the Western Cape
            — including secure gated communities — curated for first-time buyers.
          </p>
        </header>

        <div className="mb-6">
          <Suspense fallback={<div className="h-10 rounded-md bg-muted/40" />}>
            <FilterBar suburbs={suburbs} />
          </Suspense>
        </div>

        {properties.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
      <Home className="mx-auto size-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold">No properties match yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Try clearing some filters, or check back soon — we add new listings
        regularly.
      </p>
    </div>
  );
}
