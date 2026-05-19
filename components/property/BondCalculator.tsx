"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatZAR } from "@/lib/format/currency";
import {
  calculateBond,
  FLISP_MAX_INCOME,
  FLISP_MIN_INCOME,
  FLISP_MAX_PROPERTY_PRICE,
  SA_PRIME_RATE_DEFAULT,
} from "@/lib/bond/calculator";

type Props = {
  price: number;
  defaultRate?: number;
};

export function BondCalculator({
  price,
  defaultRate = SA_PRIME_RATE_DEFAULT,
}: Props) {
  const initialDeposit = Math.round(price * 0.1);
  const [depositPercent, setDepositPercent] = useState(10);
  const [ratePercent, setRatePercent] = useState(defaultRate);
  const [termYears, setTermYears] = useState(20);

  const depositAmount = Math.round((price * depositPercent) / 100);

  const result = useMemo(
    () =>
      calculateBond({
        price,
        depositAmount,
        annualRatePercent: ratePercent,
        termYears,
      }),
    [price, depositAmount, ratePercent, termYears],
  );

  const showFlispNote = price > 0 && price <= FLISP_MAX_PROPERTY_PRICE;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calculator className="size-5" />
        </div>
        <CardTitle className="text-xl">Bond repayment calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Estimate your monthly bond repayment. Defaults use the current SA
          prime lending rate ({defaultRate.toFixed(2)}%) and a 20-year term.
        </p>

        <div className="space-y-5">
          <SliderRow
            label="Deposit"
            value={`${depositPercent}% · ${formatZAR(depositAmount)}`}
            min={0}
            max={50}
            step={1}
            current={depositPercent}
            onChange={setDepositPercent}
            suffix="%"
          />
          <SliderRow
            label="Interest rate"
            value={`${ratePercent.toFixed(2)}%`}
            min={6}
            max={20}
            step={0.25}
            current={ratePercent}
            onChange={setRatePercent}
            suffix="%"
          />
          <SliderRow
            label="Loan term"
            value={`${termYears} years`}
            min={5}
            max={30}
            step={1}
            current={termYears}
            onChange={setTermYears}
            suffix="years"
          />
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Result
            label="Monthly repayment"
            value={formatZAR(Math.round(result.monthlyPayment))}
            highlight
          />
          <Result
            label="Minimum household income"
            value={formatZAR(Math.round(result.minimumGrossIncome))}
            footnote="Rule of thumb: bond ≤ 30% of gross income"
          />
          <Result
            label="Total interest"
            value={formatZAR(Math.round(result.totalInterest))}
          />
          <Result
            label="Total repayment"
            value={formatZAR(Math.round(result.totalRepayment))}
          />
        </div>

        {showFlispNote && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium">First-time buyer programmes</span>{" "}
              (general information only): subsidies such as{" "}
              <strong>FLISP / First Home Finance</strong> use published income
              bands (often around {formatZAR(FLISP_MIN_INCOME)}–{formatZAR(FLISP_MAX_INCOME)}{" "}
              gross per month) and other rules.
              Whether any programme applies to you depends on your full
              household income, first-time-buyer status, the lender, and
              official assessment — not this estimate. Ask your agent or bank
              for a personalised view; nothing here is a promise of
              qualification or subsidy.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This is an indicative estimate. Final bond terms depend on your bank's
          credit assessment.
        </p>
      </CardContent>
    </Card>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm tabular-nums text-foreground/80">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={(v) => onChange(v[0] ?? min)}
      />
    </div>
  );
}

function Result({
  label,
  value,
  highlight,
  footnote,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  footnote?: string;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-primary/40 bg-primary/5 p-4"
          : "rounded-lg border p-4"
      }
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </div>
      {footnote && (
        <div className="mt-1 text-xs text-muted-foreground">{footnote}</div>
      )}
    </div>
  );
}
