import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { formatZAR } from "@/lib/format/currency";
import { FLISP_MAX_PROPERTY_PRICE } from "@/lib/bond/calculator";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";

export type GenerateContentInput = {
  title: string;
  propertyType: "house" | "townhouse" | "apartment" | "land";
  listingType: "sale" | "rent";
  price: number;
  suburb: string;
  city: string;
  province: string;
  isGatedCommunity: boolean;
  gatedCommunityName?: string | null;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  parkingSpaces: number;
  floorSizeSqm?: number | null;
  erfSizeSqm?: number | null;
  yearBuilt?: number | null;
  features: string[];
  manualDescription?: string | null;
};

export type GeneratedContent = {
  description: string;
  seoTitle: string;
  seoDescription: string;
  neighbourhoodSummary: string;
  headline: string;
  cta: string;
};

const aiResponseSchema = z.object({
  description: z.string().min(50).max(2000),
  seo_title: z.string().min(10).max(70),
  seo_description: z.string().min(40).max(170),
  neighbourhood_summary: z.string().min(50).max(1500),
  headline: z.string().min(4).max(80),
  cta: z.string().min(2).max(40),
});

/**
 * Generate AI marketing content for a property listing.
 *
 * Tuned for SA first-time buyers: warm, plain-language tone, mentions FLISP
 * when the price band is eligible, calls out gated community / security
 * features where relevant.
 */
export async function generatePropertyContent(
  input: GenerateContentInput,
): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Set it in .env.local to use AI generation.",
    );
  }

  const client = new Anthropic({ apiKey });

  const formattedPrice = formatZAR(input.price);
  const flispEligible =
    input.listingType === "sale" && input.price <= FLISP_MAX_PROPERTY_PRICE;

  const systemPrompt = `You are a property copywriter for Eyethu Property Group, a South African real estate agency selling affordable homes in the Western Cape. Your audience is first-time home buyers in South Africa.

VOICE & STYLE:
- Warm, welcoming, and confident — like a friend showing them around the home.
- Plain English. Avoid clichés ("nestled", "boasts", "stunning") and avoid corporate jargon.
- Use second person ("you", "your family") where natural.
- Mention specific details from the input, never invent features.
- Refer to the property in South African terms: bedrooms (not "bed"), garages (not "car spots"), erf (not "lot"), bond (not "mortgage").
- Prices in the format "R 699 000" (R, space, number with spaces as thousand separators).
- Sizes in m². No imperial units.

CONTENT REQUIREMENTS:
1. description — 150 to 200 words. Open by painting a quick picture of arriving at the home. Cover key rooms/features. End with one warm line about who would love this home. Mention FLISP eligibility ONLY if explicitly told the property qualifies.
2. seo_title — 50–60 characters. Format: "[Bedrooms] Bedroom [Property Type] for [Sale|Rent] in [Suburb] — [Price] | Eyethu PG"
3. seo_description — 140–160 characters. Mention bedrooms, suburb, price, one standout feature.
4. neighbourhood_summary — 80–120 words about the suburb itself: vibe, who lives there, what's nearby (schools, shops, transport), commute. Be accurate; if you don't know specifics, speak in confident generalities South Africans recognise (e.g. "close to the N2", "an easy commute to the city").
5. headline — 4–8 words. Hero overlay. Examples: "Your first home starts here." / "A safe, fresh start in [Suburb]."
6. cta — 2–5 words. Examples: "Book a viewing today" / "Enquire now"

RESPOND WITH JSON ONLY. No markdown, no preamble. Schema:
{
  "description": string,
  "seo_title": string,
  "seo_description": string,
  "neighbourhood_summary": string,
  "headline": string,
  "cta": string
}`;

  const userPrompt = `Generate marketing content for this property:

Title: ${input.title}
Property type: ${input.propertyType}
Listing type: ${input.listingType} (${input.listingType === "sale" ? "for sale" : "to rent"})
Price: ${formattedPrice}${input.listingType === "rent" ? " per month" : ""}
Location: ${input.suburb}, ${input.city}, ${input.province}
${input.isGatedCommunity ? `Gated community: YES${input.gatedCommunityName ? ` (${input.gatedCommunityName})` : ""}` : "Gated community: no"}
Bedrooms: ${input.bedrooms}
Bathrooms: ${input.bathrooms}
Garages: ${input.garages}
Parking spaces: ${input.parkingSpaces}
${input.floorSizeSqm ? `Floor size: ${input.floorSizeSqm} m²` : ""}
${input.erfSizeSqm ? `Erf size: ${input.erfSizeSqm} m²` : ""}
${input.yearBuilt ? `Year built: ${input.yearBuilt}` : ""}
Features: ${input.features.length > 0 ? input.features.join(", ") : "—"}
${input.manualDescription ? `\nAgent's notes (use to ground your description; do not invent beyond these): ${input.manualDescription}` : ""}

FLISP-eligible price band: ${flispEligible ? "YES — feel free to mention FLISP / First Home Finance subsidy for first-time buyers earning R3,501–R22,000/month." : "NO — do not mention FLISP."}

Return JSON only.`;

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1600,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const json = extractJson(text);
  const parsed = aiResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Claude returned content that doesn't match the expected schema: ${parsed.error.message}`,
    );
  }

  return {
    description: parsed.data.description,
    seoTitle: parsed.data.seo_title,
    seoDescription: parsed.data.seo_description,
    neighbourhoodSummary: parsed.data.neighbourhood_summary,
    headline: parsed.data.headline,
    cta: parsed.data.cta,
  };
}

/** Tolerant JSON extraction: handles bare JSON or fenced ```json blocks. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // Last resort: pull the first {...} block we can find.
    const blockMatch = candidate.match(/\{[\s\S]*\}/);
    if (!blockMatch) {
      throw new Error(`Could not parse JSON from AI response: ${candidate.slice(0, 200)}`);
    }
    return JSON.parse(blockMatch[0]);
  }
}
