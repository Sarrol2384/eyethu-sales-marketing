import { formatZAR } from "@/lib/format/currency";
import type { AgentCommissionTotals } from "@/lib/commission/calculate";

type Props = {
  totals: AgentCommissionTotals;
};

export function CommissionSummaryCards({ totals }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Earned commission
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatZAR(totals.earned)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {totals.soldCount} sold listing{totals.soldCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pipeline (est.)
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatZAR(totals.pipeline)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Published sale listings at listing price
        </p>
      </div>
    </div>
  );
}
