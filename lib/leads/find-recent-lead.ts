import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Returns a lead id if the same property + phone was submitted within the last
 * 10 minutes (retry after a failed agent notification).
 */
export async function findRecentLeadForDedupe(
  supabase: SupabaseClient<Database>,
  propertyId: string | null,
  phone: string,
): Promise<{ id: string } | null> {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();

  let query = supabase
    .from("leads")
    .select("id")
    .eq("phone", phone)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  } else {
    query = query.is("property_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return { id: data.id };
}
