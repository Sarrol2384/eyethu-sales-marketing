import {
  ShieldCheck,
  Zap,
  Wifi,
  Flame,
  Trees,
  Sun,
  Snowflake,
  Waves,
  Lock,
  Camera,
  CheckCircle2,
} from "lucide-react";

type Props = {
  features: string[];
};

/** Map a feature label (free text) to a Lucide icon. Falls back to a check. */
function iconForFeature(
  label: string,
): React.ComponentType<{ className?: string }> {
  const l = label.toLowerCase();
  if (l.includes("alarm") || l.includes("armed response")) return ShieldCheck;
  if (l.includes("prepaid") || l.includes("electricity")) return Zap;
  if (l.includes("fibre") || l.includes("fiber") || l.includes("wifi"))
    return Wifi;
  if (l.includes("gas") || l.includes("fireplace") || l.includes("braai"))
    return Flame;
  if (l.includes("garden") || l.includes("trees")) return Trees;
  if (l.includes("solar") || l.includes("inverter")) return Sun;
  if (l.includes("aircon") || l.includes("a/c") || l.includes("ac"))
    return Snowflake;
  if (l.includes("pool")) return Waves;
  if (l.includes("boundary") || l.includes("wall") || l.includes("gated"))
    return Lock;
  if (l.includes("cctv") || l.includes("camera")) return Camera;
  return CheckCircle2;
}

export function PropertyFeatures({ features }: Props) {
  if (!features.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {features.map((f) => {
          const Icon = iconForFeature(f);
          return (
            <li
              key={f}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm capitalize"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
