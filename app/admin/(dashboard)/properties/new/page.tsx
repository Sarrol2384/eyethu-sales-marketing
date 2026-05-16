import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const supabase = await createSupabaseServerClient();
  const { data: agents } = await supabase
    .from("agent_accounts")
    .select("user_id, display_name, email, phone")
    .order("display_name", { ascending: true, nullsFirst: false });

  return (
    <PropertyForm
      mode="create"
      allowAgentAssignment
      agents={agents ?? []}
    />
  );
}
