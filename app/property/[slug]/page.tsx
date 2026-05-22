import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPropertyBySlug } from "@/lib/properties/queries";
import { formatZAR } from "@/lib/format/currency";
import {
  calculateBond,
  SA_PRIME_RATE_DEFAULT,
} from "@/lib/bond/calculator";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PropertyListingSummary } from "@/components/property/PropertyListingSummary";
import { PropertyDescription } from "@/components/property/PropertyDescription";
import { PropertyFeatures } from "@/components/property/PropertyFeatures";
import { NeighbourhoodInfo } from "@/components/property/NeighbourhoodInfo";
import { BondCalculator } from "@/components/property/BondCalculator";
import { ViewTracker } from "@/components/property/ViewTracker";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
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

  const priceNum = Number(property.price);
  const bondTeaser =
    property.listing_type === "sale" && priceNum > 0
      ? calculateBond({
          price: priceNum,
          depositAmount: Math.round(priceNum * 0.1),
          annualRatePercent: SA_PRIME_RATE_DEFAULT,
          termYears: 20,
        })
      : null;
  const monthlyBondEstimateLabel =
    bondTeaser && bondTeaser.monthlyPayment > 0
      ? `≈ ${formatZAR(Math.round(bondTeaser.monthlyPayment))} p/m bond`
      : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      <ViewTracker propertyId={property.id} />

      <nav className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">{property.suburb}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start lg:gap-x-8">
        <div className="lg:col-start-1 lg:row-start-1">
          <PropertyHero
            layout="clean"
            images={images}
            headline={headline}
            priceLabel={priceLabel}
            suburb={property.suburb}
          />
        </div>

        <div className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-0.5">
          <PropertyListingSummary
            headline={headline}
            propertyType={property.property_type}
            listingType={property.listing_type}
            isGatedCommunity={property.is_gated_community}
            gatedCommunityName={property.gated_community_name}
            priceLabel={priceLabel}
            monthlyBondEstimateLabel={monthlyBondEstimateLabel}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            garages={property.garages}
            floorSizeSqm={property.floor_size_sqm}
            erfSizeSqm={property.erf_size_sqm}
            propertyId={property.id}
            propertyTitle={property.title}
            cta={property.ai_cta ?? "Book a viewing"}
            agentName={property.agent_name}
            agentPhone={property.agent_phone}
            agentEmail={property.agent_email}
            agentPhotoUrl={property.agent_photo_url}
            propertyUrl={propertyUrl}
            sharePriceLabel={priceLabel}
            suburb={property.suburb}
            referralUserId={shareReferralUserId}
          />
        </div>

        <div className="mt-8 space-y-10 lg:col-start-1 lg:row-start-2 lg:mt-8">
          <PropertyDescription
            description={property.ai_description}
            fallback={property.manual_description}
          />

          <PropertyFeatures features={property.features} />

          <div id="bond-calculator">
            <BondCalculator price={priceNum} />
          </div>

          <NeighbourhoodInfo
            suburb={property.suburb}
            city={property.city}
            summary={property.ai_neighbourhood_summary}
          />
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
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
