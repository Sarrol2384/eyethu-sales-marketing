import "server-only";
import { assertDashboardAdmin } from "@/lib/auth/dashboard-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { AgentAccountRow } from "@/lib/supabase/types";

const ROSTER_COLUMNS =
  "user_id, display_name, email, phone, photo_url, created_at, default_commission_percent";

/**
 * Full agent roster for admin UI. Uses the service role after verifying the
 * caller is a dashboard admin, because agent_accounts RLS may only allow
 * agents to read their own row until the admin policy migration is applied.
 */
export async function fetchAgentRosterForAdmin(): Promise<{
  agents: AgentAccountRow[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { agents: [], error: "Unauthorized" };
  }

  try {
    await assertDashboardAdmin(supabase, user.id);
  } catch {
    return { agents: [], error: "Forbidden" };
  }

  let admin;
  try {
    admin = createSupabaseServiceClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Service client unavailable";
    return { agents: [], error: message };
  }

  const { data, error } = await admin
    .from("agent_accounts")
    .select(ROSTER_COLUMNS)
    .order("display_name", { ascending: true, nullsFirst: false });

  if (error) {
    return { agents: [], error: error.message };
  }

  return { agents: (data ?? []) as AgentAccountRow[], error: null };
}

export async function fetchAgentByIdForAdmin(
  userId: string,
): Promise<AgentAccountRow | null> {
  const { agents, error } = await fetchAgentRosterForAdmin();
  if (error) return null;
  return agents.find((a) => a.user_id === userId) ?? null;
}

/** Validate that a user id exists in agent_accounts (admin callers only). */
export async function agentAccountExistsForAdmin(
  userId: string,
): Promise<boolean> {
  const agent = await fetchAgentByIdForAdmin(userId);
  return agent != null;
}
