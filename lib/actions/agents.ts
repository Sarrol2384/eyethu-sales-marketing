"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardAdmin } from "@/lib/auth/dashboard-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  createAgentFormSchema,
  type CreateAgentFormInput,
} from "@/lib/validation/agent";

export type AgentActionState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Partial<Record<keyof CreateAgentFormInput, string>>;
};

const SUCCESS: AgentActionState = { ok: true, error: null };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  await assertDashboardAdmin(supabase, user.id);
  return { supabase, user };
}

export async function createAgent(
  input: CreateAgentFormInput,
): Promise<AgentActionState> {
  await requireAdmin();

  const parsed = createAgentFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: AgentActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] as keyof CreateAgentFormInput | undefined;
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const admin = createSupabaseServiceClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    email_confirm: true,
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Could not create user.";
    if (
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered")
    ) {
      return {
        ok: false,
        error: "An account with this email already exists.",
        fieldErrors: { email: "Use a different email or remove the existing user first." },
      };
    }
    return { ok: false, error: msg };
  }

  const userId = created.user.id;
  const { error: insertErr } = await admin.from("agent_accounts").insert({
    user_id: userId,
    display_name: data.display_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || null,
  });

  if (insertErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return {
      ok: false,
      error: insertErr.message ?? "Could not save agent profile.",
    };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/properties/new");
  return SUCCESS;
}

export async function deleteAgent(userId: string): Promise<AgentActionState> {
  await requireAdmin();

  const trimmed = userId.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing agent id." };
  }

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("agent_accounts").delete().eq("user_id", trimmed);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/properties/new");
  return SUCCESS;
}
