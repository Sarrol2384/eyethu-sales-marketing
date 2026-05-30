"use server";

import { revalidatePath } from "next/cache";
import { assertDashboardAdmin } from "@/lib/auth/dashboard-access";
import { findAuthUserIdByEmail } from "@/lib/auth/find-auth-user-by-email";
import { normalizeSAPhone } from "@/lib/format/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  createAgentFormSchema,
  updateAgentCommissionSchema,
  updateAgentProfileSchema,
  type CreateAgentFormInput,
  type UpdateAgentCommissionInput,
  type UpdateAgentProfileInput,
} from "@/lib/validation/agent";

export type AgentActionState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Partial<
    Record<keyof CreateAgentFormInput | keyof UpdateAgentProfileInput, string>
  >;
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
  const email = data.email.trim().toLowerCase();

  let created = await admin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? "Could not create user.";
    const duplicate =
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("registered");

    if (duplicate) {
      const existingUserId = await findAuthUserIdByEmail(admin, email);
      if (existingUserId) {
        const { data: existingAgent } = await admin
          .from("agent_accounts")
          .select("user_id")
          .eq("user_id", existingUserId)
          .maybeSingle();

        if (existingAgent) {
          return {
            ok: false,
            error: "An account with this email already exists.",
            fieldErrors: {
              email: "This agent is already on the roster.",
            },
          };
        }

        await admin.auth.admin.deleteUser(existingUserId);
        created = await admin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
        });
      }
    }

    if (created.error || !created.data.user) {
      const retryMsg = created.error?.message ?? msg;
      if (
        retryMsg.toLowerCase().includes("already") ||
        retryMsg.toLowerCase().includes("registered")
      ) {
        return {
          ok: false,
          error: "An account with this email already exists.",
          fieldErrors: {
            email: "Use a different email or remove the existing user first.",
          },
        };
      }
      return { ok: false, error: retryMsg };
    }
  }

  const userId = created.data.user.id;
  const { error: insertErr } = await admin.from("agent_accounts").insert({
    user_id: userId,
    display_name: data.display_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone?.trim() || null,
    default_commission_percent: data.default_commission_percent ?? null,
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

export async function updateAgentCommission(
  input: UpdateAgentCommissionInput,
): Promise<AgentActionState> {
  await requireAdmin();

  const parsed = updateAgentCommissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid commission rate.",
    };
  }

  const { user_id, default_commission_percent } = parsed.data;
  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("agent_accounts")
    .update({ default_commission_percent })
    .eq("user_id", user_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${user_id}`);
  revalidatePath("/agent/properties");
  return SUCCESS;
}

export async function updateAgentProfile(
  input: UpdateAgentProfileInput,
): Promise<AgentActionState> {
  await requireAdmin();

  const parsed = updateAgentProfileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: AgentActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] as keyof UpdateAgentProfileInput | undefined;
      if (path && path !== "user_id" && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const { user_id, display_name, email, phone } = parsed.data;
  const admin = createSupabaseServiceClient();
  const normalizedEmail = email.trim().toLowerCase();
  const phoneRaw = phone?.trim() ?? "";
  const phoneStored =
    phoneRaw === "" ? null : normalizeSAPhone(phoneRaw);

  const existingUserId = await findAuthUserIdByEmail(admin, normalizedEmail);
  if (existingUserId && existingUserId !== user_id) {
    return {
      ok: false,
      error: "An account with this email already exists.",
      fieldErrors: { email: "Another user already uses this email." },
    };
  }

  const { data: existingRow } = await admin
    .from("agent_accounts")
    .select("email")
    .eq("user_id", user_id)
    .maybeSingle();

  if (!existingRow) {
    return { ok: false, error: "Agent not found." };
  }

  const priorEmail = existingRow.email?.trim().toLowerCase() ?? "";
  if (priorEmail !== normalizedEmail) {
    const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
      email: normalizedEmail,
    });
    if (authErr) {
      return {
        ok: false,
        error: authErr.message ?? "Could not update login email.",
        fieldErrors: { email: "Check the email and try again." },
      };
    }
  }

  const { error } = await admin
    .from("agent_accounts")
    .update({
      display_name: display_name.trim(),
      email: normalizedEmail,
      phone: phoneStored,
    })
    .eq("user_id", user_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${user_id}`);
  revalidatePath("/admin/properties");
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

  const { error: authErr } = await admin.auth.admin.deleteUser(trimmed);
  if (authErr) {
    return {
      ok: false,
      error: `Agent removed from roster, but login could not be deleted: ${authErr.message}`,
    };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/admin/properties/new");
  return SUCCESS;
}
