import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPropertyBySlug } from "@/lib/properties/queries";
import { formatZAR } from "@/lib/format/currency";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import { PropertyDescription } from "@/components/property/PropertyDescription";
import { PropertyFeatures } from "@/components/property/PropertyFeatures";
import { NeighbourhoodInfo } from "@/components/property/NeighbourhoodInfo";
import { BondCalculator } from "@/components/property/BondCalculator";
import { LeadCaptureForm } from "@/components/property/LeadCaptureForm";
import { AgentCard } from "@/components/property/AgentCard";
import { ShareButtons } from "@/components/property/ShareButtons";
import { ViewTracker } from "@/components/property/ViewTracker";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardRole } from "@/lib/auth/dashboard-access";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) {
    return { title: "Property not found" };
  }

  const primary =
    property.property_images.find((i) => i.is_primary) ??
    property.property_images[0];
  const ogImageUrl = primary?.image_url;

  const title =
    property.ai_seo_title ??
    `${property.bedrooms} Bedroom ${propertyTypeLabel(property.property_type)} for ${property.listing_type === "sale" ? "Sale" : "Rent"} in ${property.suburb} — ${formatZAR(property.price)}`;
  const description =
    property.ai_seo_description ??
    `${property.bedrooms}-bedroom ${property.property_type} in ${property.suburb}, ${property.city}. ${formatZAR(property.price)}.`;

  const canonicalUrl = `${SITE_URL}/property/${property.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "en_ZA",
      siteName: "Eyethu Property Group",
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: primary?.alt_text ?? property.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const headline = property.ai_headline ?? property.title;
  const priceLabel = formatZAR(property.price);
  const propertyUrl = `${SITE_URL}/property/${property.slug}`;

  const supabase = await createSupabaseServerClient();
  let shareReferralUserId: string | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const role = await getDashboardRole(supabase, user.id);
    if (role === "agent") {
      shareReferralUserId = user.id;
    }
  }

  const images = property.property_images.map((img) => ({
    url: img.image_url,
    alt: img.alt_text ?? property.title,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
      <ViewTracker propertyId={property.id} />

      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">{property.suburb}</span>
      </nav>

      <PropertyHero
        images={images}
        headline={headline}
        priceLabel={priceLabel}
        suburb={property.suburb}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {property.property_type}
        </Badge>
        <Badge variant="secondary" className="capitalize">
          For {property.listing_type}
        </Badge>
        {property.is_gated_community && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            Gated community
            {property.gated_community_name
              ? ` · ${property.gated_community_name}`
              : ""}
          </Badge>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <PropertyDetails
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            garages={property.garages}
            floorSizeSqm={property.floor_size_sqm}
            erfSizeSqm={property.erf_size_sqm}
          />

          <PropertyDescription
            description={property.ai_description}
            fallback={property.manual_description}
          />

          <PropertyFeatures features={property.features} />

          <BondCalculator price={Number(property.price)} />

          <NeighbourhoodInfo
            suburb={property.suburb}
            city={property.city}
            summary={property.ai_neighbourhood_summary}
          />

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Share this home
            </h2>
            <ShareButtons
              url={propertyUrl}
              title={property.title}
              price={priceLabel}
              suburb={property.suburb}
              referralUserId={shareReferralUserId}
            />
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <LeadCaptureForm
            propertyId={property.id}
            propertyTitle={property.title}
            cta={property.ai_cta ?? "Book a viewing"}
          />
          <AgentCard
            name={property.agent_name}
            phone={property.agent_phone}
            email={property.agent_email}
            photoUrl={property.agent_photo_url}
            propertyTitle={property.title}
            propertyUrl={propertyUrl}
          />
        </div>
      </div>
    </main>
  );
}

function propertyTypeLabel(t: string): string {
  switch (t) {
    case "house":
      return "Home";
    case "townhouse":
      return "Townhouse";
    case "apartment":
      return "Apartment";
    case "land":
      return "Stand";
    default:
      return "Property";
  }
}
