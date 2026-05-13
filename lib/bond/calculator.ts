/**
 * SA bond / home loan math.
 *
 * Formulas:
 *   loan amount L = price - deposit
 *   monthly rate  m = annual_rate / 12 / 100
 *   months        n = term_years * 12
 *   payment       P = L * (m(1+m)^n) / ((1+m)^n - 1)
 *
 * Affordability rule of thumb: monthly bond payment <= 30% of gross household income.
 */

export type BondInputs = {
  price: number;
  depositAmount: number;
  annualRatePercent: number;
  termYears: number;
};

export type BondResult = {
  loanAmount: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  minimumGrossIncome: number;
  flispEligible: boolean;
};

export const SA_PRIME_RATE_DEFAULT = Number(
  process.env.SA_PRIME_RATE ?? process.env.NEXT_PUBLIC_SA_PRIME_RATE ?? 11.75,
);

export const FLISP_MIN_INCOME = 3501;
export const FLISP_MAX_INCOME = 22000;
/** Maximum property price that typically aligns with FLISP affordability bands. */
export const FLISP_MAX_PROPERTY_PRICE = 1_800_000;

export function calculateBond({
  price,
  depositAmount,
  annualRatePercent,
  termYears,
}: BondInputs): BondResult {
  const loanAmount = Math.max(0, price - depositAmount);
  const monthlyRate = annualRatePercent / 12 / 100;
  const months = Math.max(1, Math.round(termYears * 12));

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment = (loanAmount * (monthlyRate * factor)) / (factor - 1);
  }

  if (!Number.isFinite(monthlyPayment)) monthlyPayment = 0;

  const totalRepayment = monthlyPayment * months;
  const totalInterest = Math.max(0, totalRepayment - loanAmount);
  // 30% affordability rule
  const minimumGrossIncome = monthlyPayment / 0.3;

  return {
    loanAmount,
    monthlyPayment,
    totalRepayment,
    totalInterest,
    minimumGrossIncome,
    flispEligible:
      price > 0 &&
      price <= FLISP_MAX_PROPERTY_PRICE &&
      minimumGrossIncome >= FLISP_MIN_INCOME &&
      minimumGrossIncome <= FLISP_MAX_INCOME,
  };
}

/**
 * Returns the approximate FLISP subsidy band for a given gross monthly income.
 * Source: National Department of Human Settlements published bands.
 */
export function flispSubsidyForIncome(grossMonthlyIncome: number): number {
  if (
    grossMonthlyIncome < FLISP_MIN_INCOME ||
    grossMonthlyIncome > FLISP_MAX_INCOME
  ) {
    return 0;
  }
  // Roughly linear: R130k at the bottom of the band, R30k at the top.
  const top = 130_000;
  const bottom = 30_000;
  const range = FLISP_MAX_INCOME - FLISP_MIN_INCOME;
  const t = (grossMonthlyIncome - FLISP_MIN_INCOME) / range;
  return Math.round(top - (top - bottom) * t);
}
