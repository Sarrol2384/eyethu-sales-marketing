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

function normalise(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function listingRepresentsAgent(
  listing: {
    assigned_user_id: string | null;
    sourced_by_user_id: string | null;
    agent_name: string | null;
    agent_email: string | null;
  },
  userId: string,
  name: string | null,
  email: string | null,
): boolean {
  if (
    listing.assigned_user_id === userId ||
    listing.sourced_by_user_id === userId
  ) {
    return true;
  }
  const rosterEmail = normalise(email);
  const listingEmail = normalise(listing.agent_email);
  if (rosterEmail && listingEmail && rosterEmail === listingEmail) {
    return true;
  }
  const rosterName = normalise(name);
  const listingName = normalise(listing.agent_name);
  if (rosterName && listingName && rosterName === listingName) {
    return true;
  }
  return false;
}

async function resolveReferralAgentPhotoUrl(
  admin: SupabaseClient<Database>,
  userId: string,
  rosterPhotoUrl: string | null,
  name: string | null,
  email: string | null,
  propertyId?: string | null,
): Promise<string | null> {
  const roster = rosterPhotoUrl?.trim();
  if (roster) return roster;

  if (propertyId) {
    const { data: listing } = await admin
      .from("properties")
      .select(
        "agent_photo_url, assigned_user_id, sourced_by_user_id, agent_name, agent_email",
      )
      .eq("id", propertyId)
      .maybeSingle();

    if (listing) {
      const url = listing.agent_photo_url?.trim();
      if (url && listingRepresentsAgent(listing, userId, name, email)) {
        return url;
      }
    }
  }

  const { data: rows } = await admin
    .from("properties")
    .select(
      "agent_photo_url, assigned_user_id, sourced_by_user_id, agent_name, agent_email, updated_at",
    )
    .or(`assigned_user_id.eq.${userId},sourced_by_user_id.eq.${userId}`)
    .not("agent_photo_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  for (const row of rows ?? []) {
    const url = row.agent_photo_url?.trim();
    if (url) return url;
  }

  const rosterEmail = normalise(email);
  const rosterName = normalise(name);
  if (!rosterEmail && !rosterName) return null;

  const { data: byContact } = await admin
    .from("properties")
    .select("agent_photo_url, agent_name, agent_email, updated_at")
    .not("agent_photo_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  for (const row of byContact ?? []) {
    const url = row.agent_photo_url?.trim();
    if (!url) continue;
    const listingEmail = normalise(row.agent_email);
    const listingName = normalise(row.agent_name);
    if (rosterEmail && listingEmail && rosterEmail === listingEmail) {
      return url;
    }
    if (rosterName && listingName && rosterName === listingName) {
      return url;
    }
  }

  return null;
}

/**
 * Resolves the public-facing contact details for a referring agent (the
 * `?ref=<user_id>` share code). Uses the service role because `agent_accounts`
 * is not readable by anonymous visitors under RLS.
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
    .select("user_id, display_name, phone, email, photo_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const name = data.display_name?.trim() || null;
  const email = data.email?.trim() || null;

  const photoUrl = await resolveReferralAgentPhotoUrl(
    admin,
    userId,
    data.photo_url,
    name,
    email,
    options?.propertyId,
  );

  return {
    userId: data.user_id,
    name,
    phone: data.phone?.trim() || null,
    email,
    photoUrl,
  };
}
