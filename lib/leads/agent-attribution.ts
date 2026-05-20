import "server-only";

import type {
  LeadAgentDisplay,
  LeadAgentPart,
  LeadAgentRole,
  LeadForAgentAttribution,
  LeadForAgentCount,
} from "@/lib/leads/agent-attribution-types";

export type {
  LeadAgentDisplay,
  LeadAgentPart,
  LeadAgentRole,
  LeadForAgentAttribution,
  LeadForAgentCount,
  LeadPropertyAgents,
} from "@/lib/leads/agent-attribution-types";

const ROLE_LABEL: Record<LeadAgentRole, string> = {
  referral: "referral",
  assigned: "assigned",
  sourced: "sourced",
};

/**
 * Builds a combined agent label for a lead, e.g.
 * "Nomonde (referral) · Zoliswa (assigned)".
 */
export function buildLeadAgentDisplay(
  lead: LeadForAgentAttribution,
  nameByUserId: Map<string, string>,
): LeadAgentDisplay {
  const parts: LeadAgentPart[] = [];
  const seen = new Set<string>();

  function addPart(userId: string | null | undefined, role: LeadAgentRole) {
    if (!userId || seen.has(`${userId}:${role}`)) return;
    seen.add(`${userId}:${role}`);
    const name =
      nameByUserId.get(userId)?.trim() || userId.slice(0, 8);
    parts.push({ userId, role, name });
  }

  addPart(lead.attributed_agent_user_id, "referral");

  const property = lead.properties;
  if (property) {
    addPart(property.assigned_user_id, "assigned");
    addPart(property.sourced_by_user_id, "sourced");
  }

  if (parts.length > 0) {
    return {
      label: parts
        .map((p) => `${p.name} (${ROLE_LABEL[p.role]})`)
        .join(" · "),
      parts,
    };
  }

  const listingName = property?.agent_name?.trim();
  if (listingName) {
    return {
      label: `${listingName} (listing)`,
      parts: [],
    };
  }

  return { label: null, parts: [] };
}

/** Collects dashboard agent user IDs referenced on leads. */
export function collectAgentUserIdsFromLeads(
  leads: LeadForAgentAttribution[],
): string[] {
  const ids = new Set<string>();
  for (const lead of leads) {
    if (lead.attributed_agent_user_id) {
      ids.add(lead.attributed_agent_user_id);
    }
    const property = lead.properties;
    if (property?.assigned_user_id) ids.add(property.assigned_user_id);
    if (property?.sourced_by_user_id) ids.add(property.sourced_by_user_id);
  }
  return [...ids];
}

/**
 * Counts leads per agent using the same rules as the agent portal RLS scope.
 * A lead may count toward multiple agents on shared listings.
 */
export function countLeadsForAgents(
  leads: LeadForAgentCount[],
  agentUserIds: string[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of agentUserIds) {
    counts.set(id, 0);
  }

  for (const lead of leads) {
    const matched = new Set<string>();
    if (lead.attributed_agent_user_id) {
      matched.add(lead.attributed_agent_user_id);
    }
    const property = lead.properties;
    if (property?.assigned_user_id) {
      matched.add(property.assigned_user_id);
    }
    if (property?.sourced_by_user_id) {
      matched.add(property.sourced_by_user_id);
    }

    for (const userId of matched) {
      if (counts.has(userId)) {
        counts.set(userId, (counts.get(userId) ?? 0) + 1);
      }
    }
  }

  return counts;
}
