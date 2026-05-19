import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const { agents } = await fetchAgentRosterForAdmin();

  return (
    <PropertyForm
      mode="create"
      allowAgentAssignment
      agents={agents.map((a) => ({
        user_id: a.user_id,
        display_name: a.display_name,
        email: a.email,
        phone: a.phone,
      }))}
    />
  );
}
