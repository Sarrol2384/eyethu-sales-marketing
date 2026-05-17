import { Bed, Bath, Car, Square, Maximize } from "lucide-react";

type Props = {
  bedrooms: number;
  bathrooms: number;
  garages: number;
  floorSizeSqm: number | null;
  erfSizeSqm: number | null;
  variant?: "default" | "compact";
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-3 text-center sm:flex-row sm:gap-3 sm:text-left">
      <Icon className="size-5 text-primary" />
      <div>
        <div className="text-base font-semibold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CompactStat({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

export function PropertyDetails({
  bedrooms,
  bathrooms,
  garages,
  floorSizeSqm,
  erfSizeSqm,
  variant = "default",
}: Props) {
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-border/60 py-3">
        <CompactStat icon={Bed} value={`${bedrooms} bed`} />
        <CompactStat icon={Bath} value={`${bathrooms} bath`} />
        <CompactStat icon={Car} value={`${garages} garage`} />
        {floorSizeSqm !== null && (
          <CompactStat icon={Square} value={`${floorSizeSqm} m² floor`} />
        )}
        {erfSizeSqm !== null && (
          <CompactStat icon={Maximize} value={`${erfSizeSqm} m² erf`} />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-xl border bg-card sm:grid-cols-5">
      <Stat icon={Bed} label="Bedrooms" value={String(bedrooms)} />
      <Stat icon={Bath} label="Bathrooms" value={String(bathrooms)} />
      <Stat icon={Car} label="Garages" value={String(garages)} />
      {floorSizeSqm !== null && (
        <Stat icon={Square} label="Floor" value={`${floorSizeSqm} m²`} />
      )}
      {erfSizeSqm !== null && (
        <Stat icon={Maximize} label="Erf" value={`${erfSizeSqm} m²`} />
      )}
    </div>
  );
}
