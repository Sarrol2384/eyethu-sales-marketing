import Link from "next/link";
import Image from "next/image";
import { Bed, Bath, Car, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/format/currency";
import type { PropertyListItem } from "@/lib/properties/queries";

export function PropertyCard({ property }: { property: PropertyListItem }) {
  return (
    <Link
      href={`/property/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {property.primary_image_url ? (
          <Image
            src={property.primary_image_url}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No photo yet
          </div>
        )}
        {property.is_gated_community && (
          <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground hover:bg-primary">
            <ShieldCheck className="size-3.5" />
            Gated
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xl font-semibold tabular-nums text-primary">
          {formatZAR(Number(property.price))}
        </div>
        <h3 className="line-clamp-2 text-base font-medium leading-snug">
          {property.title}
        </h3>
        <div className="text-sm text-muted-foreground">{property.suburb}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/80">
          <span className="inline-flex items-center gap-1">
            <Bed className="size-3.5" /> {property.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="size-3.5" /> {property.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Car className="size-3.5" /> {property.garages}
          </span>
          <span className="ml-auto capitalize text-muted-foreground">
            {property.property_type}
          </span>
        </div>
      </div>
    </Link>
  );
}
