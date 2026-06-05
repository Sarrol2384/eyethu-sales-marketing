import { NextResponse } from "next/server";
import { assertDashboardAdmin } from "@/lib/auth/dashboard-access";
import { generatePropertyContent } from "@/lib/ai/generate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  firstZodIssueMessage,
  generateContentRequestSchema,
} from "@/lib/validation/generate-content";

export async function POST(request: Request) {
  // Admin-only — must have a valid Supabase session.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertDashboardAdmin(supabase, user.id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateContentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: firstZodIssueMessage(parsed.error),
        details: parsed.error.flatten(),
      },
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
