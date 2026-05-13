import "server-only";
import { getBrevoClient, getBrevoSender } from "./client";
import { formatZAR } from "@/lib/format/currency";
import { formatSAPhoneDisplay } from "@/lib/format/phone";
import { MOVE_TIMELINE_LABELS, type MoveTimelineValue } from "@/lib/validation/lead";

export type AgentLeadEmailInput = {
  agentEmail: string;
  agentName?: string | null;
  leadName: string;
  leadPhone: string;
  leadEmail?: string | null;
  leadMessage?: string | null;
  isFirstTimeBuyer: boolean;
  moveTimeline?: MoveTimelineValue | null;
  property: {
    title: string;
    suburb: string;
    price: number;
    slug: string;
  } | null;
  siteUrl: string;
};

export type LeadConfirmationEmailInput = {
  leadEmail: string;
  leadName: string;
  property: {
    title: string;
    suburb: string;
    slug: string;
  } | null;
  agentName?: string | null;
  agentPhone?: string | null;
  siteUrl: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );

/**
 * Notify an agent that a new lead has come in for one of their listings.
 * Returns the Brevo messageId or `null` if Brevo isn't configured.
 */
export async function sendAgentLeadEmail(
  input: AgentLeadEmailInput,
): Promise<string | null> {
  const client = getBrevoClient();
  if (!client) return null;

  const propertyLine = input.property
    ? `<strong>${escapeHtml(input.property.title)}</strong> in ${escapeHtml(input.property.suburb)} — ${formatZAR(input.property.price)}`
    : `<em>General enquiry (no specific property)</em>`;

  const propertyUrl = input.property
    ? `${input.siteUrl}/property/${input.property.slug}`
    : input.siteUrl;

  const timelineLabel = input.moveTimeline
    ? MOVE_TIMELINE_LABELS[input.moveTimeline]
    : "Not specified";

  const subject = `New lead: ${input.leadName} — ${input.property ? input.property.suburb : "general enquiry"}`;

  const htmlContent = `<!doctype html>
<html><body style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin:0 0 16px; color: #0c4a6e;">New lead — Eyethu PG</h2>
  <p style="margin:0 0 16px;">You've received a new enquiry${input.agentName ? `, ${escapeHtml(input.agentName)}` : ""}.</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
    <tr><td style="border-bottom: 1px solid #eee;"><strong>Name</strong></td><td style="border-bottom: 1px solid #eee;">${escapeHtml(input.leadName)}</td></tr>
    <tr><td style="border-bottom: 1px solid #eee;"><strong>Phone</strong></td><td style="border-bottom: 1px solid #eee;"><a href="tel:${escapeHtml(input.leadPhone)}">${escapeHtml(formatSAPhoneDisplay(input.leadPhone))}</a></td></tr>
    ${input.leadEmail ? `<tr><td style="border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(input.leadEmail)}">${escapeHtml(input.leadEmail)}</a></td></tr>` : ""}
    <tr><td style="border-bottom: 1px solid #eee;"><strong>First-time buyer</strong></td><td style="border-bottom: 1px solid #eee;">${input.isFirstTimeBuyer ? "Yes" : "No"}</td></tr>
    <tr><td style="border-bottom: 1px solid #eee;"><strong>Move timeline</strong></td><td style="border-bottom: 1px solid #eee;">${escapeHtml(timelineLabel)}</td></tr>
    <tr><td style="border-bottom: 1px solid #eee;"><strong>Property</strong></td><td style="border-bottom: 1px solid #eee;">${propertyLine}</td></tr>
  </table>
  ${input.leadMessage ? `<h3 style="margin: 20px 0 4px; font-size: 14px;">Message</h3><p style="margin:0 0 16px; padding: 12px; background: #f5f5f5; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(input.leadMessage)}</p>` : ""}
  <p style="margin: 24px 0 0;"><a href="${escapeHtml(propertyUrl)}" style="display:inline-block; background:#0c4a6e; color:#fff; text-decoration:none; padding: 10px 18px; border-radius: 6px;">View listing</a></p>
  <p style="font-size: 12px; color: #888; margin-top: 32px;">This is an automated notification from your Eyethu Property Group dashboard.</p>
</body></html>`;

  const response = await client.transactionalEmails.sendTransacEmail({
    sender: getBrevoSender(),
    to: [{ email: input.agentEmail, name: input.agentName ?? undefined }],
    subject,
    htmlContent,
    replyTo: input.leadEmail
      ? { email: input.leadEmail, name: input.leadName }
      : undefined,
  });

  return response.messageId ?? null;
}

/**
 * Thank-you email back to the lead confirming we received their enquiry.
 */
export async function sendLeadConfirmationEmail(
  input: LeadConfirmationEmailInput,
): Promise<string | null> {
  const client = getBrevoClient();
  if (!client) return null;

  const propertyLine = input.property
    ? `<strong>${escapeHtml(input.property.title)}</strong> in ${escapeHtml(input.property.suburb)}`
    : "our properties";

  const propertyUrl = input.property
    ? `${input.siteUrl}/property/${input.property.slug}`
    : input.siteUrl;

  const subject = "Thanks for getting in touch with Eyethu Property Group";

  const htmlContent = `<!doctype html>
<html><body style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin:0 0 16px; color: #0c4a6e;">Thanks, ${escapeHtml(input.leadName.split(" ")[0])}!</h2>
  <p style="margin:0 0 12px;">We've received your enquiry about ${propertyLine}. One of our agents${input.agentName ? `, ${escapeHtml(input.agentName)},` : ""} will be in touch within one business day.</p>
  ${input.agentPhone ? `<p style="margin:0 0 12px;">If you'd like to chat sooner, give us a call on <a href="tel:${escapeHtml(input.agentPhone)}">${escapeHtml(formatSAPhoneDisplay(input.agentPhone))}</a>.</p>` : ""}
  ${input.property ? `<p style="margin: 24px 0;"><a href="${escapeHtml(propertyUrl)}" style="display:inline-block; background:#0c4a6e; color:#fff; text-decoration:none; padding: 10px 18px; border-radius: 6px;">View the listing again</a></p>` : ""}
  <h3 style="margin: 24px 0 6px; font-size: 14px;">First-time buyer? A quick tip.</h3>
  <p style="margin:0 0 12px; font-size: 14px; color:#444;">If you earn between R3,501 and R22,000/month, you may qualify for FLISP (First Home Finance) — a subsidy of R30,000 to R130,000 to help you buy your first home. We can walk you through it.</p>
  <p style="font-size: 12px; color: #888; margin-top: 32px;">— The Eyethu Property Group team</p>
</body></html>`;

  const response = await client.transactionalEmails.sendTransacEmail({
    sender: getBrevoSender(),
    to: [{ email: input.leadEmail, name: input.leadName }],
    subject,
    htmlContent,
  });

  return response.messageId ?? null;
}
