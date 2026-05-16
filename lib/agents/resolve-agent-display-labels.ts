import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const MAX_IDS = 200;

/**
 * Resolves `agent_accounts.display_name` for the given user IDs using the
 * service-role client (bypasses RLS). Call only from trusted server code after
 * the caller has scoped IDs from an RLS-filtered query (e.g. agent leads).
 * Does not load peer email or phone.
 */
export async function resolveAgentDisplayLabelsByUserIds(
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean).slice(0, MAX_IDS);
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const admin = createSupabaseServiceClient();
  const { data, error } = await admin
    .from("agent_accounts")
    .select("user_id, display_name")
    .in("user_id", unique);

  if (error) {
    console.error("resolveAgentDisplayLabelsByUserIds:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    const label =
      row.display_name?.trim() || row.user_id.slice(0, 8);
    map.set(row.user_id, label);
  }

  return map;
}
