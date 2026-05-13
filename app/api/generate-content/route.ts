import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePropertyContent } from "@/lib/ai/generate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  title: z.string().min(2).max(200),
  propertyType: z.enum(["house", "townhouse", "apartment", "land"]),
  listingType: z.enum(["sale", "rent"]),
  price: z.number().nonnegative(),
  suburb: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  province: z.string().min(1).max(120),
  isGatedCommunity: z.boolean(),
  gatedCommunityName: z.string().max(160).nullable().optional(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  garages: z.number().int().nonnegative(),
  parkingSpaces: z.number().int().nonnegative(),
  floorSizeSqm: z.number().nonnegative().nullable().optional(),
  erfSizeSqm: z.number().nonnegative().nullable().optional(),
  yearBuilt: z.number().int().nullable().optional(),
  features: z.array(z.string()).default([]),
  manualDescription: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  // Admin-only — must have a valid Supabase session.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const content = await generatePropertyContent(parsed.data);
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[generate-content] failed", err);
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
