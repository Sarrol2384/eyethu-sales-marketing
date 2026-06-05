import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { normalizeSAPhone } from "@/lib/format/phone";

export type PropertyNotifyContext = {
  id: string;
  title: string;
  slug: string;
  suburb: string;
  price: number;
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
  assigned_user_id: string | null;
  sourced_by_user_id: string | null;
};

export type AgentNotifyIdentity = {
  email: string;
  name: string | null;
  /** Where the inbox was resolved (for logs). */
  source:
    | "referral"
    | "assigned"
    | "sourced"
    | "listing_card";
};

async function rosterAgentEmail(
  supabase: SupabaseClient<Database>,
  userId: string,
  source: AgentNotifyIdentity["source"],
): Promise<AgentNotifyIdentity | null> {
  const { data } = await supabase
    .from("agent_accounts")
    .select("email, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.email?.trim()) return null;
  return {
    email: data.email.trim(),
    name: data.display_name ?? null,
    source,
  };
}

async function rosterAgentPhone(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("agent_accounts")
    .select("phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.phone) return null;
  return normalizeSAPhone(data.phone);
}

/**
 * Picks one inbox for "new lead" emails:
 * 1. Share-link / ?ref= agent (attributed)
 * 2. Assigned dashboard agent
 * 3. Sourcing agent
 * 4. Listing card agent_email (legacy / display fallback)
 */
export async function resolveAgentLeadEmailRecipient(
  supabase: SupabaseClient<Database>,
  property: PropertyNotifyContext | null,
  attributedAgentUserId: string | null,
): Promise<AgentNotifyIdentity | null> {
  if (attributedAgentUserId) {
    const ref = await rosterAgentEmail(supabase, attributedAgentUserId, "referral");
    if (ref) return ref;
  }

  if (property) {
    if (property.assigned_user_id) {
      const assigned = await rosterAgentEmail(
        supabase,
        property.assigned_user_id,
        "assigned",
      );
      if (assigned) return assigned;
    }

    if (property.sourced_by_user_id) {
      const sourced = await rosterAgentEmail(
        supabase,
        property.sourced_by_user_id,
        "sourced",
      );
      if (sourced) return sourced;
    }

    if (property.agent_email?.trim()) {
      return {
        email: property.agent_email.trim(),
        name: property.agent_name,
        source: "listing_card",
      };
    }
  }

  return null;
}

/**
 * Phone for SMS alerts: ref agent, assigned, sourced, then listing card phone.
 */
export async function resolveAgentLeadSmsPhone(
  supabase: SupabaseClient<Database>,
  property: PropertyNotifyContext | null,
  attributedAgentUserId: string | null,
): Promise<string | null> {
  if (attributedAgentUserId) {
    const phone = await rosterAgentPhone(supabase, attributedAgentUserId);
    if (phone) return phone;
  }

  if (!property) return null;

  for (const userId of [
    property.assigned_user_id,
    property.sourced_by_user_id,
  ]) {
    if (!userId) continue;
    const phone = await rosterAgentPhone(supabase, userId);
    if (phone) return phone;
  }

  if (property.agent_phone) {
    const n = normalizeSAPhone(property.agent_phone);
    if (n) return n;
  }

  return null;
}
