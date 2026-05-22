import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getDashboardRole } from "@/lib/auth/dashboard-access";
import {
  buildPropertyFormInitial,
  mapPropertyImagesForForm,
} from "@/lib/properties/form-initial";
import type {
  PropertyImageRow,
  PropertyRow,
} from "@/lib/supabase/types";

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

  const initial = buildPropertyFormInitial(row);

  return (
    <PropertyForm
      mode="edit"
      propertyId={row.id}
      initialValues={initial}
      initialImages={mapPropertyImagesForForm(row.property_images)}
      allowAgentAssignment={false}
      propertiesBasePath="/agent/properties"
    />
  );
}
