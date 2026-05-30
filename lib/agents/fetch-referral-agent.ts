import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

export type ReferralAgentPublic = {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
};

async function resolveReferralAgentPhotoUrl(
  admin: SupabaseClient<Database>,
  userId: string,
  propertyId?: string | null,
): Promise<string | null> {
  if (propertyId) {
    const { data: listing } = await admin
      .from("properties")
      .select("agent_photo_url, assigned_user_id, sourced_by_user_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (listing) {
      const onListing =
        listing.assigned_user_id === userId ||
        listing.sourced_by_user_id === userId;
      const url = listing.agent_photo_url?.trim();
      if (onListing && url) return url;
    }
  }

  const { data: rows } = await admin
    .from("properties")
    .select("agent_photo_url")
    .or(`assigned_user_id.eq.${userId},sourced_by_user_id.eq.${userId}`)
    .not("agent_photo_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  const fallback = rows?.[0]?.agent_photo_url?.trim();
  return fallback || null;
}

/**
 * Resolves the public-facing contact details for a referring agent (the
 * `?ref=<user_id>` share code). Uses the service role because `agent_accounts`
 * is not readable by anonymous visitors under RLS. Returns only the fields we
 * intend to show on a public listing's agent card — never commission or
 * internal data.
 *
 * Photos are stored per listing (`properties.agent_photo_url`), not on the
 * agent roster — we reuse a photo from this listing (when the agent is
 * assigned/sourced) or their most recently updated listing that has one.
 */
export async function fetchReferralAgentPublic(
  userId: string,
  options?: { propertyId?: string | null },
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

  const photoUrl = await resolveReferralAgentPhotoUrl(
    admin,
    userId,
    options?.propertyId,
  );

  return {
    userId: data.user_id,
    name: data.display_name?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    photoUrl,
  };
}
