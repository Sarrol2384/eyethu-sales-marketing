import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";
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

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
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

  const { agents: agentList } = await fetchAgentRosterForAdmin();

  let assignedAgentEmail = "";
  if (row.assigned_user_id) {
    const roster = agentList.find(
      (a) => a.user_id === row.assigned_user_id,
    );
    if (roster?.email?.trim()) {
      assignedAgentEmail = roster.email.trim();
    } else {
      try {
        const svc = createSupabaseServiceClient();
        const { data: authUser, error: authErr } =
          await svc.auth.admin.getUserById(row.assigned_user_id);
        if (!authErr && authUser.user?.email) {
          assignedAgentEmail = authUser.user.email;
        }
      } catch {
        // Non-fatal — form still loads without assigned email hint.
      }
    }
  }

  const initial = buildPropertyFormInitial(row, { assignedAgentEmail });

  return (
    <PropertyForm
      mode="edit"
      propertyId={row.id}
      initialValues={initial}
      initialImages={mapPropertyImagesForForm(row.property_images)}
      allowAgentAssignment
      agents={agentList.map((a) => ({
        user_id: a.user_id,
        display_name: a.display_name,
        email: a.email,
        phone: a.phone,
      }))}
    />
  );
}
