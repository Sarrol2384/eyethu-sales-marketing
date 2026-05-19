import { formatZAR } from "@/lib/format/currency";
import type { AgentCommissionDisplay } from "@/lib/commission/calculate";

type Props = {
  display: AgentCommissionDisplay;
};

export function PropertyCommissionCell({ display }: Props) {
  if (display.amount == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="tabular-nums">
      {formatZAR(display.amount)}
      {display.kind === "pipeline" && (
        <span className="ml-1 text-xs text-muted-foreground">est.</span>
      )}
    </span>
  );
}
