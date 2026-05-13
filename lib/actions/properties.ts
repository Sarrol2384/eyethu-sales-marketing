"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { propertyFormSchema, type PropertyFormInput } from "@/lib/validation/property";
import { buildPropertySlug, bumpSlug } from "@/lib/slugify";

export type PropertyActionState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Partial<Record<keyof PropertyFormInput, string>>;
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
  return supabase;
}

export async function createProperty(
  input: PropertyFormInput,
): Promise<PropertyActionState & { id?: string; slug?: string }> {
  const supabase = await requireUser();

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
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single();

    if (!error && inserted) {
      revalidatePath("/admin/properties");
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
  const supabase = await requireUser();

  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
    };
  }

  const data = parsed.data;
  const { error } = await supabase
    .from("properties")
    .update({
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
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}/edit`);
  revalidatePath("/");
  return SUCCESS;
}

export async function setPropertyStatus(
  id: string,
  status: "draft" | "published" | "sold",
): Promise<PropertyActionState> {
  const supabase = await requireUser();
  const updates: { status: typeof status; published_at?: string } = { status };
  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/properties");
  revalidatePath("/");
  return SUCCESS;
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = await requireUser();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/admin/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}

export async function markLeadContacted(
  id: string,
  contacted: boolean,
): Promise<PropertyActionState> {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({
      contacted,
      contacted_at: contacted ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  return SUCCESS;
}
