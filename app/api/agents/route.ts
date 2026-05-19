import { NextResponse } from "next/server";
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";

export async function GET() {
  const { agents, error } = await fetchAgentRosterForAdmin();
  if (error === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    agents: agents.map((a) => ({
      user_id: a.user_id,
      display_name: a.display_name,
      email: a.email,
      phone: a.phone,
    })),
  });
}
