import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { LeadCategory, MoveTimeline } from "@/lib/supabase/types";
import { formatZAR } from "@/lib/format/currency";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

const MOVE_LABELS: Record<MoveTimeline, string> = {
  asap: "ASAP",
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  "6_plus_months": "6+ months",
  just_browsing: "Just browsing",
};

export type LeadSummaryInput = {
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
  isFirstTimeBuyer: boolean;
  moveTimeline: MoveTimeline | null | undefined;
  score: number;
  category: LeadCategory;
  ruleReasons: string[];
  property: {
    title: string;
    suburb: string;
    price: number;
  } | null;
};

function isLeadAiSummaryEnabled(): boolean {
  if (process.env.LEAD_AI_SUMMARY_ENABLED === "false") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Claude narrative for admin/agent triage. Returns null on disable, timeout,
 * or error — caller should fall back to rule-based reasons.
 */
export async function generateLeadSummary(
  input: LeadSummaryInput,
  options?: { timeoutMs?: number },
): Promise<string | null> {
  if (!isLeadAiSummaryEnabled()) return null;

  const timeoutMs = options?.timeoutMs ?? 8_000;
  const apiKey = process.env.ANTHROPIC_API_KEY!.trim();
  const client = new Anthropic({ apiKey });

  const propertyLine = input.property
    ? `${input.property.title} in ${input.property.suburb} (${formatZAR(input.property.price)})`
    : "General enquiry (no specific listing)";

  const timeline = input.moveTimeline
    ? (MOVE_LABELS[input.moveTimeline] ?? input.moveTimeline)
    : "Not specified";

  const userPrompt = `Summarise this property lead for an Eyethu PG agent in South Africa.

Lead: ${input.fullName}
Phone: ${input.phone}
Email: ${input.email ?? "not provided"}
First-time buyer: ${input.isFirstTimeBuyer ? "yes" : "no"}
Move timeline: ${timeline}
Listing: ${propertyLine}
Rule score: ${input.score}/100 (${input.category})
Rule signals: ${input.ruleReasons.join("; ")}
${input.message ? `Buyer message: ${input.message}` : "Buyer message: none"}

Write 2–4 short sentences in plain South African English. Say how warm the lead is, what they want, and the best next step (e.g. WhatsApp call, viewing). Do not invent facts not in the data. No bullet points.`;

  const request = client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 280,
    system:
      "You write brief CRM notes for a Cape Town estate agency. Be practical and warm. Never promise FLISP or bond approval.",
    messages: [{ role: "user", content: userPrompt }],
  });

  try {
    const response = await Promise.race([
      request,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Lead summary timeout")), timeoutMs),
      ),
    ]);

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text || text.length < 20) return null;
    return text.slice(0, 600);
  } catch (err) {
    console.error("[lead-summary] generate failed", err);
    return null;
  }
}
