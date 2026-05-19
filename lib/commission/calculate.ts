import type { ListingType, PropertyStatus } from "@/lib/supabase/types";

export type CommissionListing = {
  listing_type: ListingType;
  status: PropertyStatus;
  price: number;
  sold_price?: number | null;
  commission_percent?: number | null;
  commission_amount?: number | null;
  assigned_user_id?: string | null;
  sourced_by_user_id?: string | null;
};

export type AgentDefaultsMap = ReadonlyMap<string, number | null | undefined>;

export type AgentCommissionTotals = {
  earned: number;
  pipeline: number;
  soldCount: number;
};

export type AgentCommissionDisplay = {
  amount: number | null;
  kind: "earned" | "pipeline" | null;
};

function listingBasePrice(
  listing: CommissionListing,
  forStatus: "sold" | "published",
): number {
  if (forStatus === "sold") {
    return Number(listing.sold_price ?? listing.price);
  }
  return Number(listing.price);
}

function totalListingCommission(
  listing: CommissionListing,
  forStatus: "sold" | "published",
  agentDefaults: AgentDefaultsMap,
): number | null {
  if (listing.listing_type !== "sale") return null;

  const basePrice = listingBasePrice(listing, forStatus);

  if (listing.commission_amount != null) {
    return Number(listing.commission_amount);
  }

  const assignedDefault = listing.assigned_user_id
    ? agentDefaults.get(listing.assigned_user_id)
    : null;
  const sourcedDefault = listing.sourced_by_user_id
    ? agentDefaults.get(listing.sourced_by_user_id)
    : null;

  const pct =
    listing.commission_percent ??
    assignedDefault ??
    sourcedDefault ??
    null;

  if (pct == null) return null;
  return basePrice * (Number(pct) / 100);
}

/** Split listing commission between assigned and sourcing agents (50/50 if different). */
export function agentShareOnListing(
  listing: Pick<
    CommissionListing,
    "assigned_user_id" | "sourced_by_user_id"
  >,
  agentUserId: string,
  commission: number,
): number {
  const isAssigned = listing.assigned_user_id === agentUserId;
  const isSourced = listing.sourced_by_user_id === agentUserId;
  if (!isAssigned && !isSourced) return 0;

  const assignedId = listing.assigned_user_id;
  const sourcedId = listing.sourced_by_user_id;

  if (
    assignedId &&
    sourcedId &&
    assignedId !== sourcedId &&
    (isAssigned || isSourced)
  ) {
    return commission * 0.5;
  }

  return commission;
}

export function computeAgentCommissionShare(
  listing: CommissionListing,
  agentUserId: string,
  agentDefaults: AgentDefaultsMap,
  forStatus: "sold" | "published",
): number | null {
  const isLinked =
    listing.assigned_user_id === agentUserId ||
    listing.sourced_by_user_id === agentUserId;
  if (!isLinked) return null;

  const total = totalListingCommission(listing, forStatus, agentDefaults);
  if (total == null) return null;

  const share = agentShareOnListing(listing, agentUserId, total);
  return share > 0 ? share : null;
}

export function getAgentCommissionDisplay(
  listing: CommissionListing,
  agentUserId: string,
  agentDefaults: AgentDefaultsMap,
): AgentCommissionDisplay {
  if (listing.listing_type !== "sale") {
    return { amount: null, kind: null };
  }

  if (listing.status === "sold") {
    const amount = computeAgentCommissionShare(
      listing,
      agentUserId,
      agentDefaults,
      "sold",
    );
    return { amount, kind: amount != null ? "earned" : null };
  }

  if (listing.status === "published") {
    const amount = computeAgentCommissionShare(
      listing,
      agentUserId,
      agentDefaults,
      "published",
    );
    return { amount, kind: amount != null ? "pipeline" : null };
  }

  return { amount: null, kind: null };
}

export function sumAgentCommissions(
  listings: CommissionListing[],
  agentUserId: string,
  agentDefaults: AgentDefaultsMap,
): AgentCommissionTotals {
  let earned = 0;
  let pipeline = 0;
  let soldCount = 0;

  for (const listing of listings) {
    const isLinked =
      listing.assigned_user_id === agentUserId ||
      listing.sourced_by_user_id === agentUserId;
    if (!isLinked) continue;

    if (listing.status === "sold") {
      soldCount += 1;
      const share = computeAgentCommissionShare(
        listing,
        agentUserId,
        agentDefaults,
        "sold",
      );
      if (share != null) earned += share;
    } else if (listing.status === "published") {
      const share = computeAgentCommissionShare(
        listing,
        agentUserId,
        agentDefaults,
        "published",
      );
      if (share != null) pipeline += share;
    }
  }

  return { earned, pipeline, soldCount };
}

export function buildAgentDefaultsMap(
  agents: Array<{ user_id: string; default_commission_percent?: number | null }>,
): AgentDefaultsMap {
  return new Map(
    agents.map((a) => [a.user_id, a.default_commission_percent ?? null]),
  );
}
