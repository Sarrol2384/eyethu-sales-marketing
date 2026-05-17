import { MapPin } from "lucide-react";

type Props = {
  suburb: string;
  city: string;
  summary: string | null;
};

export function NeighbourhoodInfo({ suburb, city, summary }: Props) {
  if (!summary) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <MapPin className="size-6 text-primary" />
        {suburb}
        <span className="font-sans text-base font-normal text-muted-foreground">
          · {city}
        </span>
      </h2>
      <div className="space-y-3 text-base leading-relaxed text-foreground/90">
        {summary.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>
    </section>
  );
}
