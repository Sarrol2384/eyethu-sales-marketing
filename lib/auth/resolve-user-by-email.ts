import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Resolve a Supabase Auth user id from their login email (admin tooling only).
 * Uses the service-role client; never expose results to anonymous clients.
 */
export async function resolveUserIdByEmail(
  email: string,
): Promise<string | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  const admin = createSupabaseServiceClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error || !data?.users) return null;

  const match = data.users.find(
    (u) => u.email?.trim().toLowerCase() === trimmed,
  );
  return match?.id ?? null;
}
