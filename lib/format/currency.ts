/**
 * Format a number as South African Rand using the platform house style:
 *
 *   formatZAR(699000)   -> "R 699 000"
 *   formatZAR(1250000)  -> "R 1 250 000"
 *   formatZAR(null)     -> "Price on request"
 *
 * We use a regular ASCII space as the thousand separator (matches the spec
 * exactly and renders correctly in WhatsApp, FB and SMS previews — narrow
 * no-break spaces sometimes get stripped by mobile keyboards).
 */
export function formatZAR(
  amount: number | null | undefined,
  options: { showCents?: boolean; fallback?: string } = {},
): string {
  const { showCents = false, fallback = "Price on request" } = options;

  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return fallback;
  }

  const rounded = showCents ? amount : Math.round(amount);
  const fixed = showCents ? rounded.toFixed(2) : rounded.toString();
  const [whole, decimals] = fixed.split(".");

  // Insert a space every three digits from the right.
  const wholeWithSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return decimals
    ? `R ${wholeWithSpaces},${decimals}`
    : `R ${wholeWithSpaces}`;
}

/**
 * Compact format for tight UI (cards on small screens):
 *   formatZARCompact(1_250_000)  -> "R 1.25M"
 *   formatZARCompact(699_000)    -> "R 699K"
 */
export function formatZARCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "POA";
  }
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 2)}M`;
  }
  if (amount >= 1_000) {
    return `R ${Math.round(amount / 1_000)}K`;
  }
  return `R ${amount}`;
}
