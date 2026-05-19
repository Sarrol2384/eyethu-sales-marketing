import { Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsTable, type AdminLead } from "@/components/admin/LeadsTable";
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";

type RawLead = Omit<AdminLead, "attributed_agent_label"> & {
  attributed_agent_user_id: string | null;
};

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { sort, dir } = await searchParams;
  const sortKey =
    sort === "score" || sort === "property" ? sort : "created_at";
  const ascending = dir === "asc";

  const supabase = await createSupabaseServerClient();

  let query = supabase.from("leads").select(
    `id, full_name, phone, email, message, is_first_time_buyer,
     move_timeline, lead_score, lead_category, ai_summary,
     contacted, contacted_at, created_at, attributed_agent_user_id,
     properties:property_id ( id, title, slug, suburb )`,
  );

  if (sortKey === "score") {
    query = query.order("lead_score", { ascending, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending });
  }

  const { data } = await query.limit(500);
  const rawLeads = (data ?? []) as unknown as RawLead[];

  // Resolve attributed agent names in one query.
  const attributedIds = [
    ...new Set(
      rawLeads
        .map((l) => l.attributed_agent_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const agentLabelMap = new Map<string, string>();
  if (attributedIds.length > 0) {
    const { agents: agentRows } = await fetchAgentRosterForAdmin();
    for (const a of agentRows) {
      if (!attributedIds.includes(a.user_id)) continue;
      agentLabelMap.set(
        a.user_id,
        a.display_name?.trim() || a.email?.trim() || a.user_id.slice(0, 8),
      );
    }
  }

  const leads: AdminLead[] = rawLeads.map((l) => ({
    ...l,
    attributed_agent_label: l.attributed_agent_user_id
      ? (agentLabelMap.get(l.attributed_agent_user_id) ?? null)
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="size-6 text-primary" />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length === 1 ? "" : "s"} captured. Click a
            row to see the full enquiry.
          </p>
        </div>
      </div>

      <LeadsTable leads={leads} currentSort={sortKey} currentDir={dir ?? "desc"} />
    </div>
  );
}
