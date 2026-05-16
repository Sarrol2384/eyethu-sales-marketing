import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getDashboardRole } from "@/lib/auth/dashboard-access";
import type {
  PropertyImageRow,
  PropertyRow,
} from "@/lib/supabase/types";
import type { PropertyFormInput } from "@/lib/validation/property";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentEditPropertyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/agent/login");

  const role = await getDashboardRole(supabase, user.id);
  if (role !== "agent") {
    redirect(`/admin/properties/${id}/edit`);
  }

  const { data } = await supabase
    .from("properties")
    .select(
      `*, property_images ( id, image_url, is_primary, display_order )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const row = data as unknown as PropertyRow & {
    property_images: PropertyImageRow[];
  };

  const canEdit =
    row.assigned_user_id === user.id || row.sourced_by_user_id === user.id;
  if (!canEdit) {
    notFound();
  }

  const initial: Partial<PropertyFormInput> = {
    title: row.title,
    property_type: row.property_type,
    listing_type: row.listing_type,
    status: row.status,
    price: Number(row.price),
    address: row.address ?? "",
    suburb: row.suburb,
    city: row.city,
    province: row.province,
    is_gated_community: row.is_gated_community,
    gated_community_name: row.gated_community_name ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    garages: row.garages,
    parking_spaces: row.parking_spaces,
    floor_size_sqm:
      row.floor_size_sqm !== null ? Number(row.floor_size_sqm) : undefined,
    erf_size_sqm:
      row.erf_size_sqm !== null ? Number(row.erf_size_sqm) : undefined,
    year_built: row.year_built ?? undefined,
    features: row.features,
    manual_description: row.manual_description ?? "",
    ai_description: row.ai_description ?? "",
    ai_seo_title: row.ai_seo_title ?? "",
    ai_seo_description: row.ai_seo_description ?? "",
    ai_neighbourhood_summary: row.ai_neighbourhood_summary ?? "",
    ai_headline: row.ai_headline ?? "",
    ai_cta: row.ai_cta ?? "",
    agent_name: row.agent_name ?? "",
    agent_phone: row.agent_phone ?? "",
    agent_email: row.agent_email ?? "",
    agent_photo_url: row.agent_photo_url ?? "",
    assigned_agent_email: "",
    sourced_by_user_id: row.sourced_by_user_id ?? "",
  };

  return (
    <PropertyForm
      mode="edit"
      propertyId={row.id}
      initialValues={initial}
      initialImages={row.property_images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
        display_order: img.display_order,
      }))}
      allowAgentAssignment={false}
      propertiesBasePath="/agent/properties"
    />
  );
}
