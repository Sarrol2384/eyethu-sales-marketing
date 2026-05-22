"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertDashboardAdmin, getDashboardRole } from "@/lib/auth/dashboard-access";
import { agentAccountExistsForAdmin } from "@/lib/agents/fetch-agent-roster";
import { resolveUserIdByEmail } from "@/lib/auth/resolve-user-by-email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { propertyFormSchema, type PropertyFormInput } from "@/lib/validation/property";
import { buildPropertySlug, bumpSlug } from "@/lib/slugify";

export type PropertyActionState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Partial<
    Record<keyof PropertyFormInput, string>
  >;
};

const SUCCESS: PropertyActionState = { ok: true, error: null };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function createProperty(
  input: PropertyFormInput,
): Promise<PropertyActionState & { id?: string; slug?: string }> {
  const { supabase, user } = await requireUser();
  await assertDashboardAdmin(supabase, user.id);

  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: PropertyActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] as keyof PropertyFormInput | undefined;
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  let assignedUserId: string | null = null;
  const uid = data.assigned_user_id?.trim();
  if (uid) {
    if (!(await agentAccountExistsForAdmin(uid))) {
      return {
        ok: false,
        error: "Selected agent is invalid or no longer exists.",
        fieldErrors: {
          assigned_user_id: "Pick a valid agent or leave unassigned.",
        },
      };
    }
    assignedUserId = uid;
  } else {
    const assignEmail = data.assigned_agent_email?.trim();
    if (assignEmail) {
      assignedUserId = await resolveUserIdByEmail(assignEmail);
      if (!assignedUserId) {
        return {
          ok: false,
          error: "No dashboard user found with that assigned agent email.",
          fieldErrors: {
            assigned_agent_email: "Check the login email and try again.",
          },
        };
      }
      if (!(await agentAccountExistsForAdmin(assignedUserId))) {
        return {
          ok: false,
          error: "That user is not registered as an agent.",
          fieldErrors: {
            assigned_agent_email:
              "Create an agent account first under Agents.",
          },
        };
      }
    }
  }

  let sourcedByUserId: string | null = null;
  const sourcedUid = data.sourced_by_user_id?.trim();
  if (sourcedUid) {
    if (!(await agentAccountExistsForAdmin(sourcedUid))) {
      return {
        ok: false,
        error: "Selected sourcing agent is invalid or no longer exists.",
        fieldErrors: {
          sourced_by_user_id: "Pick a valid agent or leave unassigned.",
        },
      };
    }
    sourcedByUserId = sourcedUid;
  }

  // Generate a unique slug with retry on conflict.
  let slug = buildPropertySlug(data.title, data.suburb);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: inserted, error } = await supabase
      .from("properties")
      .insert({
        title: data.title,
        slug,
        status: data.status,
        property_type: data.property_type,
        listing_type: data.listing_type,
        price: data.price,
        address: data.address || null,
        suburb: data.suburb,
        city: data.city,
        province: data.province,
        is_gated_community: data.is_gated_community,
        gated_community_name: data.gated_community_name || null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        garages: data.garages,
        parking_spaces: data.parking_spaces,
        floor_size_sqm: data.floor_size_sqm ?? null,
        erf_size_sqm: data.erf_size_sqm ?? null,
        year_built: data.year_built ?? null,
        features: data.features,
        manual_description: data.manual_description || null,
        ai_description: data.ai_description || null,
        ai_seo_title: data.ai_seo_title || null,
        ai_seo_description: data.ai_seo_description || null,
        ai_neighbourhood_summary: data.ai_neighbourhood_summary || null,
        ai_headline: data.ai_headline || null,
        ai_cta: data.ai_cta || null,
        agent_name: data.agent_name || null,
        agent_phone: data.agent_phone || null,
        agent_email: data.agent_email || null,
        agent_photo_url: data.agent_photo_url || null,
        assigned_user_id: assignedUserId,
        sourced_by_user_id: sourcedByUserId,
        commission_percent: data.commission_percent ?? null,
        commission_amount: data.commission_amount ?? null,
        sold_price:
          data.status === "sold" ? (data.sold_price ?? null) : null,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single();

    if (!error && inserted) {
      revalidatePath("/admin/properties");
      revalidatePath("/admin/agents");
      revalidatePath("/agent/properties");
      revalidatePath("/");
      return { ...SUCCESS, id: inserted.id, slug: inserted.slug };
    }

    if (error?.code === "23505") {
      // Unique violation on slug — bump and retry.
      slug = bumpSlug(slug);
      continue;
    }

    return { ok: false, error: error?.message ?? "Could not save property." };
  }

  return { ok: false, error: "Could not generate a unique slug. Try a different title." };
}

export async function updateProperty(
  id: string,
  input: PropertyFormInput,
): Promise<PropertyActionState> {
  const { supabase, user } = await requireUser();
  const role = await getDashboardRole(supabase, user.id);

  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
    };
  }

  const data = parsed.data;

  const basePayload = {
    title: data.title,
    status: data.status,
    property_type: data.property_type,
    listing_type: data.listing_type,
    price: data.price,
    address: data.address || null,
    suburb: data.suburb,
    city: data.city,
    province: data.province,
    is_gated_community: data.is_gated_community,
    gated_community_name: data.gated_community_name || null,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    garages: data.garages,
    parking_spaces: data.parking_spaces,
    floor_size_sqm: data.floor_size_sqm ?? null,
    erf_size_sqm: data.erf_size_sqm ?? null,
    year_built: data.year_built ?? null,
    features: data.features,
    manual_description: data.manual_description || null,
    ai_description: data.ai_description || null,
    ai_seo_title: data.ai_seo_title || null,
    ai_seo_description: data.ai_seo_description || null,
    ai_neighbourhood_summary: data.ai_neighbourhood_summary || null,
    ai_headline: data.ai_headline || null,
    ai_cta: data.ai_cta || null,
    agent_name: data.agent_name || null,
    agent_phone: data.agent_phone || null,
    agent_email: data.agent_email || null,
    agent_photo_url: data.agent_photo_url || null,
  };

  let assignedPatch: { assigned_user_id: string | null } | Record<string, never> =
    {};
  if (role === "admin") {
    const uid = data.assigned_user_id?.trim();
    if (uid) {
      if (!(await agentAccountExistsForAdmin(uid))) {
        return {
          ok: false,
          error: "Selected agent is invalid or no longer exists.",
          fieldErrors: {
            assigned_user_id: "Pick a valid agent or leave unassigned.",
          },
        };
      }
      assignedPatch = { assigned_user_id: uid };
    } else {
      const assignEmail = data.assigned_agent_email?.trim();
      if (assignEmail) {
        const resolved = await resolveUserIdByEmail(assignEmail);
        if (!resolved) {
          return {
            ok: false,
            error: "No dashboard user found with that assigned agent email.",
            fieldErrors: {
              assigned_agent_email: "Check the login email and try again.",
            },
          };
        }
        if (!(await agentAccountExistsForAdmin(resolved))) {
          return {
            ok: false,
            error: "That user is not registered as an agent.",
            fieldErrors: {
              assigned_agent_email:
                "Create an agent account first under Agents.",
            },
          };
        }
        assignedPatch = { assigned_user_id: resolved };
      } else {
        assignedPatch = { assigned_user_id: null };
      }
    }
  }

  let sourcedPatch: { sourced_by_user_id: string | null } | Record<string, never> =
    {};
  let commissionPatch:
    | {
        commission_percent: number | null;
        commission_amount: number | null;
        sold_price: number | null;
      }
    | Record<string, never> = {};

  if (role === "admin") {
    const sid = data.sourced_by_user_id?.trim();
    if (sid) {
      if (!(await agentAccountExistsForAdmin(sid))) {
        return {
          ok: false,
          error: "Selected sourcing agent is invalid or no longer exists.",
          fieldErrors: {
            sourced_by_user_id: "Pick a valid agent or leave unassigned.",
          },
        };
      }
      sourcedPatch = { sourced_by_user_id: sid };
    } else {
      sourcedPatch = { sourced_by_user_id: null };
    }

    commissionPatch = {
      commission_percent: data.commission_percent ?? null,
      commission_amount: data.commission_amount ?? null,
      sold_price:
        data.status === "sold" ? (data.sold_price ?? null) : null,
    };
  }

  const { error } = await supabase
    .from("properties")
    .update({
      ...basePayload,
      ...assignedPatch,
      ...sourcedPatch,
      ...commissionPatch,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/properties");
  revalidatePath("/admin/agents");
  revalidatePath("/agent/properties");
  revalidatePath(`/admin/properties/${id}/edit`);
  revalidatePath(`/agent/properties/${id}/edit`);
  revalidatePath("/");
  return SUCCESS;
}

export async function setPropertyStatus(
  id: string,
  status: "draft" | "published" | "sold",
  options?: { soldPrice?: number },
): Promise<PropertyActionState> {
  const { supabase } = await requireUser();
  const updates: {
    status: typeof status;
    published_at?: string;
    sold_price?: number | null;
  } = { status };
  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }
  if (status === "sold" && options?.soldPrice != null) {
    updates.sold_price = options.soldPrice;
  }
  const { error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/properties");
  revalidatePath("/admin/agents");
  revalidatePath("/agent/properties");
  revalidatePath(`/admin/properties/${id}/edit`);
  revalidatePath("/");
  return SUCCESS;
}

export async function deleteProperty(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await assertDashboardAdmin(supabase, user.id);
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/admin/properties");
  revalidatePath("/admin/agents");
  revalidatePath("/agent/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}

export async function markLeadContacted(
  id: string,
  contacted: boolean,
): Promise<PropertyActionState> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({
      contacted,
      contacted_at: contacted ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  revalidatePath("/agent/leads");
  return SUCCESS;
}

const leadIdSchema = z.string().uuid();

/** Admin-only — permanently removes a lead enquiry. */
export async function deleteLead(id: string): Promise<PropertyActionState> {
  const { supabase, user } = await requireUser();
  await assertDashboardAdmin(supabase, user.id);

  const parsed = leadIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid lead id" };
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/agents");
  revalidatePath("/agent/leads");
  return SUCCESS;
}
