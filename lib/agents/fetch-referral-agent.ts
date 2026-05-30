import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ReferralAgentPublic = {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

/**
 * Resolves the public-facing contact details for a referring agent (the
 * `?ref=<user_id>` share code). Uses the service role because `agent_accounts`
 * is not readable by anonymous visitors under RLS. Returns only the fields we
 * intend to show on a public listing's agent card — never commission or
 * internal data.
 */
export async function fetchReferralAgentPublic(
  userId: string,
): Promise<ReferralAgentPublic | null> {
  let admin;
  try {
    admin = createSupabaseServiceClient();
  } catch {
    return null;
  }

  const { data, error } = await admin
    .from("agent_accounts")
    .select("user_id, display_name, phone, email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    name: data.display_name?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
  };
}
