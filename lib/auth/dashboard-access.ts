import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type DashboardRole = "admin" | "agent";

export async function getDashboardRole(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardRole> {
  const { data } = await supabase
    .from("agent_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? "agent" : "admin";
}

export async function assertDashboardAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const role = await getDashboardRole(supabase, userId);
  if (role !== "admin") {
    throw new Error("Forbidden");
  }
}
