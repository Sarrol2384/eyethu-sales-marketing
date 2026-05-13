import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./env";
import type { Database } from "./types";

/**
 * Service-role Supabase client. Bypasses RLS — use only for server-side admin
 * actions that need elevated privileges (e.g. inserting page_views from a
 * route handler, or running admin-only cron tasks).
 *
 * NEVER import this from a client component or expose its results unfiltered.
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
