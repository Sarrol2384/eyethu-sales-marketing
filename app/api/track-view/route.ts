import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const trackViewSchema = z.object({
  property_id: z.string().uuid(),
  referrer: z.string().max(2000).nullable().optional(),
  utm_source: z.string().max(120).nullable().optional(),
  utm_medium: z.string().max(120).nullable().optional(),
  utm_campaign: z.string().max(120).nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = trackViewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    await supabase.from("page_views").insert({
      property_id: parsed.data.property_id,
      referrer: parsed.data.referrer ?? null,
      utm_source: parsed.data.utm_source ?? null,
      utm_medium: parsed.data.utm_medium ?? null,
      utm_campaign: parsed.data.utm_campaign ?? null,
    });
  } catch (err) {
    console.error("[track-view] insert failed", err);
  }

  // Always 204 — this is fire-and-forget; we don't want the client to retry.
  return new NextResponse(null, { status: 204 });
}
