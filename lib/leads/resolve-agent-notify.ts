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
};

/**
 * Picks one inbox for "new lead" emails: listing card email, then share ref
 * agent, then assigned dashboard agent, then sourcing agent.
 */
export async function resolveAgentLeadEmailRecipient(
  supabase: SupabaseClient<Database>,
  property: PropertyNotifyContext | null,
  attributedAgentUserId: string | null,
): Promise<AgentNotifyIdentity | null> {
  if (property?.agent_email?.trim()) {
    return {
      email: property.agent_email.trim(),
      name: property.agent_name,
    };
  }

  if (attributedAgentUserId) {
    const { data } = await supabase
      .from("agent_accounts")
      .select("email, display_name")
      .eq("user_id", attributedAgentUserId)
      .maybeSingle();
    if (data?.email?.trim()) {
      return {
        email: data.email.trim(),
        name: data.display_name ?? null,
      };
    }
  }

  if (!property) return null;

  for (const userId of [
    property.assigned_user_id,
    property.sourced_by_user_id,
  ]) {
    if (!userId) continue;
    const { data } = await supabase
      .from("agent_accounts")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.email?.trim()) {
      return {
        email: data.email.trim(),
        name: data.display_name ?? null,
      };
    }
  }

  return null;
}

/**
 * Phone for SMS alerts: listing card phone, ref agent roster phone, then
 * assigned / sourcing agent roster phones.
 */
export async function resolveAgentLeadSmsPhone(
  supabase: SupabaseClient<Database>,
  property: PropertyNotifyContext | null,
  attributedAgentUserId: string | null,
): Promise<string | null> {
  if (property?.agent_phone) {
    const n = normalizeSAPhone(property.agent_phone);
    if (n) return n;
  }

  if (attributedAgentUserId) {
    const { data } = await supabase
      .from("agent_accounts")
      .select("phone")
      .eq("user_id", attributedAgentUserId)
      .maybeSingle();
    if (data?.phone) {
      const n = normalizeSAPhone(data.phone);
      if (n) return n;
    }
  }

  if (!property) return null;

  for (const userId of [
    property.assigned_user_id,
    property.sourced_by_user_id,
  ]) {
    if (!userId) continue;
    const { data } = await supabase
      .from("agent_accounts")
      .select("phone")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.phone) {
      const n = normalizeSAPhone(data.phone);
      if (n) return n;
    }
  }

  return null;
}
