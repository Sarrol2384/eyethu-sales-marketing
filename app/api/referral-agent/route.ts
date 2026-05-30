import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchReferralAgentPublic } from "@/lib/agents/fetch-referral-agent";

const querySchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    id: searchParams.get("id"),
    property_id: searchParams.get("property_id") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ agent: null }, { status: 200 });
  }

  const agent = await fetchReferralAgentPublic(parsed.data.id, {
    propertyId: parsed.data.property_id,
  });

  // No card-worthy contact details — let the listing fall back to its default agent.
  if (!agent || (!agent.name && !agent.phone && !agent.email)) {
    return NextResponse.json({ agent: null }, { status: 200 });
  }

  return NextResponse.json({ agent }, { status: 200 });
}
