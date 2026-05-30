import "server-only";

export type BrevoSendResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const DEFAULT_ATTEMPTS = 3;
const BACKOFF_MS = [0, 500, 1000, 2000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBrevoError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/**
 * Retries a Brevo API call when Vercel egress or Brevo IP checks cause transient
 * failures on the first request.
 */
export async function withBrevoRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { attempts?: number },
): Promise<BrevoSendResult<T>> {
  const attempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  let lastError = "Brevo request failed";

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await sleep(BACKOFF_MS[i] ?? 2000);
    }
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (error) {
      lastError = formatBrevoError(error);
      console.error(
        `[brevo] ${label} attempt ${i + 1}/${attempts} failed`,
        error,
      );
    }
  }

  return { ok: false, error: lastError };
}
