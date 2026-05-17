import Link from "next/link";
import { LeadCaptureForm } from "@/components/property/LeadCaptureForm";
import { AgentCard } from "@/components/property/AgentCard";
import { ShareButtons } from "@/components/property/ShareButtons";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import { Badge } from "@/components/ui/badge";

type ListingType = "sale" | "rent";

type Props = {
  headline: string;
  propertyType: string;
  listingType: ListingType;
  isGatedCommunity: boolean;
  gatedCommunityName: string | null;
  priceLabel: string;
  monthlyBondEstimateLabel: string | null;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  floorSizeSqm: number | null;
  erfSizeSqm: number | null;
  addressLine: string | null;
  propertyId: string;
  propertyTitle: string;
  cta: string;
  agentName: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  agentPhotoUrl: string | null;
  propertyUrl: string;
  sharePriceLabel: string;
  suburb: string;
  referralUserId: string | null;
};

function typeLabel(t: string): string {
  switch (t) {
    case "house":
      return "House";
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

export function PropertyListingSummary({
  headline,
  propertyType,
  listingType,
  isGatedCommunity,
  gatedCommunityName,
  priceLabel,
  monthlyBondEstimateLabel,
  bedrooms,
  bathrooms,
  garages,
  floorSizeSqm,
  erfSizeSqm,
  addressLine,
  propertyId,
  propertyTitle,
  cta,
  agentName,
  agentPhone,
  agentEmail,
  agentPhotoUrl,
  propertyUrl,
  sharePriceLabel,
  suburb,
  referralUserId,
}: Props) {
  const forLabel = listingType === "sale" ? "sale" : "rent";
  const statusText = `${typeLabel(propertyType)} for ${forLabel}`;

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-7">
      <div className="space-y-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="capitalize">{statusText}</span>
          </p>
          <h1 className="font-heading mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {headline}
          </h1>
          <p className="font-heading mt-2 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
            {priceLabel}
          </p>
          {monthlyBondEstimateLabel ? (
            <p className="mt-1 text-sm text-muted-foreground">
              <Link
                href="#bond-calculator"
                className="text-primary underline-offset-2 hover:underline"
              >
                {monthlyBondEstimateLabel}
              </Link>{" "}
              <span className="text-xs">(indicative, 20-year term)</span>
            </p>
          ) : null}
        </div>

        <PropertyDetails
          variant="compact"
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          garages={garages}
          floorSizeSqm={floorSizeSqm}
          erfSizeSqm={erfSizeSqm}
        />

        {addressLine ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {addressLine}
          </p>
        ) : null}

        {isGatedCommunity && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            Gated community
            {gatedCommunityName ? ` · ${gatedCommunityName}` : ""}
          </Badge>
        )}

        <div className="space-y-4 border-t pt-5">
          <LeadCaptureForm
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            cta={cta}
          />
          <AgentCard
            name={agentName}
            phone={agentPhone}
            email={agentEmail}
            photoUrl={agentPhotoUrl}
            propertyTitle={propertyTitle}
            propertyUrl={propertyUrl}
          />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Share this home
            </p>
            <ShareButtons
              url={propertyUrl}
              title={propertyTitle}
              price={sharePriceLabel}
              suburb={suburb}
              referralUserId={referralUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
