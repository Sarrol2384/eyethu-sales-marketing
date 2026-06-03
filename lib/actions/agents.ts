"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertDashboardAdmin } from "@/lib/auth/dashboard-access";
import { findAuthUserIdByEmail } from "@/lib/auth/find-auth-user-by-email";
import { normalizeSAPhone } from "@/lib/format/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  PROPERTY_IMAGES_BUCKET,
  extractPropertyImagesStoragePath,
} from "@/lib/supabase/storage-path";
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
  photoUrl?: string | null;
};

const SUCCESS: AgentActionState = { ok: true, error: null };

const agentUserIdSchema = z.string().uuid("Invalid agent id");

const MAX_ROSTER_PHOTO_BYTES = 3 * 1024 * 1024;

async function removeRosterPhotoObject(
  admin: ReturnType<typeof createSupabaseServiceClient>,
  photoUrl: string | null | undefined,
) {
  const path = photoUrl?.trim()
    ? extractPropertyImagesStoragePath(photoUrl.trim())
    : null;
  if (!path) return;
  await admin.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
}

function revalidateAgentPaths(userId: string) {
  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${userId}`);
}

const SUPABASE_UNAVAILABLE =
  "Cannot reach Supabase. Check your internet connection and try again.";

type RequireAdminResult =
  | { ok: true; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; user: { id: string } }
  | { ok: false; error: string };

async function requireAdmin(): Promise<RequireAdminResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Unauthorized. Sign in again at /admin/login." };
    }
    await assertDashboardAdmin(supabase, user.id);
    return { ok: true, supabase, user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Forbidden") {
      return { ok: false, error: "You do not have permission to manage agents." };
    }
    return { ok: false, error: SUPABASE_UNAVAILABLE };
  }
}

export async function createAgent(
  input: CreateAgentFormInput,
): Promise<AgentActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

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
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

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
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

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

  revalidateAgentPaths(user_id);
  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/new");
  return SUCCESS;
}

export async function uploadAgentRosterPhoto(
  userId: string,
  formData: FormData,
): Promise<AgentActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = agentUserIdSchema.safeParse(userId.trim());
  if (!idParsed.success) {
    return { ok: false, error: "Invalid agent." };
  }
  const user_id = idParsed.data;

  const file = formData.get("photo");
  if (!(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "File must be a JPEG, PNG, or WebP image." };
  }
  if (file.size > MAX_ROSTER_PHOTO_BYTES) {
    return {
      ok: false,
      error: "Image is too large. Try a smaller file (under 3 MB).",
    };
  }

  const admin = createSupabaseServiceClient();
  const { data: existing } = await admin
    .from("agent_accounts")
    .select("photo_url")
    .eq("user_id", user_id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Agent not found." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `agents/${user_id}/photo-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, bytes, {
      upsert: false,
      contentType: file.type,
      cacheControl: "31536000",
    });

  if (uploadError) {
    return {
      ok: false,
      error: uploadError.message ?? "Could not upload image to storage.",
    };
  }

  const { data: pub } = admin.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { data: updated, error: updateError } = await admin
    .from("agent_accounts")
    .update({ photo_url: publicUrl })
    .eq("user_id", user_id)
    .select("photo_url")
    .maybeSingle();

  if (updateError) {
    await admin.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
    const hint =
      updateError.message.includes("photo_url") &&
      updateError.message.includes("column")
        ? " Database migration missing: run 20260530140000_agent_accounts_photo_url.sql in Supabase."
        : "";
    return {
      ok: false,
      error: `${updateError.message}${hint}`,
    };
  }

  if (!updated?.photo_url) {
    await admin.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
    return {
      ok: false,
      error: "Photo saved to storage but not linked to the agent. Check admin permissions.",
    };
  }

  await removeRosterPhotoObject(admin, existing.photo_url);
  revalidateAgentPaths(user_id);

  return { ok: true, error: null, photoUrl: updated.photo_url };
}

export async function removeAgentRosterPhoto(
  userId: string,
): Promise<AgentActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = agentUserIdSchema.safeParse(userId.trim());
  if (!idParsed.success) {
    return { ok: false, error: "Invalid agent." };
  }
  const user_id = idParsed.data;

  const admin = createSupabaseServiceClient();
  const { data: existing } = await admin
    .from("agent_accounts")
    .select("photo_url")
    .eq("user_id", user_id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Agent not found." };
  }

  const { error } = await admin
    .from("agent_accounts")
    .update({ photo_url: null })
    .eq("user_id", user_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeRosterPhotoObject(admin, existing.photo_url);
  revalidateAgentPaths(user_id);

  return { ok: true, error: null, photoUrl: null };
}

export async function deleteAgent(userId: string): Promise<AgentActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

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
