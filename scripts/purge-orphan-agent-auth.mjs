/**
 * One-off: remove an orphaned Supabase Auth user (no agent_accounts row).
 * Usage: node scripts/purge-orphan-agent-auth.mjs blandile@mjgrealestate.co.za
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function findAuthUserIdByEmail(admin, email) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalized,
    );
    if (match) return match.id;
    if (data.users.length < 1000) break;
    page += 1;
  }
  return null;
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/purge-orphan-agent-auth.mjs <email>");
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userId = await findAuthUserIdByEmail(admin, email);
if (!userId) {
  console.log(`No Auth user found for ${email}`);
  process.exit(0);
}

const { data: agentRow } = await admin
  .from("agent_accounts")
  .select("user_id")
  .eq("user_id", userId)
  .maybeSingle();

if (agentRow) {
  console.error(
    `User ${userId} still has an agent_accounts row — remove from admin roster first.`,
  );
  process.exit(1);
}

const { error } = await admin.auth.admin.deleteUser(userId);
if (error) {
  console.error("Delete failed:", error.message);
  process.exit(1);
}

console.log(`Deleted orphaned Auth user ${userId} (${email})`);
