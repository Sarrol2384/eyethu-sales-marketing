"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Browser-side Supabase client. Use from Client Components.
 */
export function createSupabaseBrowserClient() {
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  try {
    // Fail fast with a clear message if .env.local has a typo or bad copy-paste.
    // eslint-disable-next-line no-new -- URL constructor validates shape
    new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not a valid URL (got: ${url.slice(0, 80)}…). Fix .env.local and restart the dev server.`,
    );
  }
  return createBrowserClient<Database>(url, anonKey);
}
