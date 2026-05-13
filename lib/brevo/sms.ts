import "server-only";
import {
  getBrevoClient,
  getBrevoSmsSender,
  isBrevoSmsEnabled,
} from "./client";
import { normalizeSAPhone } from "@/lib/format/phone";

export type AgentLeadSmsInput = {
  agentPhone: string;
  leadName: string;
  leadPhone: string;
  propertyTitle?: string | null;
  suburb?: string | null;
};

/**
 * Send an SMS alert to an agent for a hot lead.
 *
 * - No-ops (returns null) when:
 *     BREVO_SMS_ENABLED !== "true"  OR  Brevo isn't configured
 *     OR the agent phone can't be normalised to an SA number.
 * - Brevo's transactional SMS expects E.164 WITHOUT the leading "+".
 *
 * Keep the body short — long SMS get split into 2+ segments and cost more.
 */
export async function sendAgentLeadSMS(
  input: AgentLeadSmsInput,
): Promise<string | null> {
  if (!isBrevoSmsEnabled()) return null;

  const client = getBrevoClient();
  if (!client) return null;

  const normalised = normalizeSAPhone(input.agentPhone);
  if (!normalised) return null;
  const recipient = normalised.replace(/^\+/, "");

  const context = input.propertyTitle
    ? `${input.propertyTitle}${input.suburb ? ` (${input.suburb})` : ""}`
    : "general enquiry";

  const content = `Eyethu PG: HOT lead — ${input.leadName} (${input.leadPhone}) on ${context}. Check your dashboard.`.slice(
    0,
    160,
  );

  const response = await client.transactionalSms.sendTransacSms({
    sender: getBrevoSmsSender(),
    recipient,
    content,
    type: "transactional",
  });

  const messageId = (response as { messageId?: string | number | null })
    .messageId;
  return messageId != null ? String(messageId) : null;
}
