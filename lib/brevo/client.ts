import "server-only";
import { BrevoClient } from "@getbrevo/brevo";

let cached: BrevoClient | null = null;

/**
 * Returns a memoised BrevoClient or `null` if `BREVO_API_KEY` is not set.
 *
 * Returning null (rather than throwing) lets callers decide whether the
 * integration is essential for the current request. The lead-capture flow,
 * for example, should still SAVE the lead even if Brevo is misconfigured —
 * just log a warning and move on.
 */
export function getBrevoClient(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  if (cached) return cached;
  cached = new BrevoClient({ apiKey });
  return cached;
}

export function getBrevoSender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL ?? "hello@example.co.za",
    name: process.env.BREVO_SENDER_NAME ?? "Eyethu Property Group",
  };
}

export function isBrevoSmsEnabled(): boolean {
  return process.env.BREVO_SMS_ENABLED === "true";
}

export function getBrevoSmsSender(): string {
  // SMS sender ID — must be ≤ 11 chars, alphanumeric only.
  return process.env.BREVO_SMS_SENDER ?? "EyethuPG";
}
