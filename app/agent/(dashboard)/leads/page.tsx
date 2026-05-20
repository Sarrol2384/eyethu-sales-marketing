import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsTable, type AdminLead } from "@/components/admin/LeadsTable";

type RawLead = Omit<AdminLead, "agent_label" | "agent_parts"> & {
  attributed_agent_user_id: string | null;
};

export const dynamic = "force-dynamic";

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/agent/login");

  const { sort, dir } = await searchParams;
  const sortKey =
    sort === "score" || sort === "property" ? sort : "created_at";
  const ascending = dir === "asc";

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

  const leads: AdminLead[] = rawLeads.map((lead) => ({
    ...lead,
    agent_label: null,
    agent_parts: [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="size-6 text-primary" />
            My leads
          </h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length === 1 ? "" : "s"} for your assigned
            or sourced listings, plus enquiries attributed to you from your
            share link. Click a row for details.
          </p>
        </div>
      </div>

      <LeadsTable
        leads={leads}
        currentSort={sortKey}
        currentDir={dir ?? "desc"}
        listBasePath="/agent/leads"
        showAgentColumn={false}
      />
    </div>
  );
}
