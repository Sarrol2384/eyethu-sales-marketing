import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Agents cannot edit listings — admin only. */
export default async function AgentEditPropertyPage({ params }: PageProps) {
  await params;
  redirect("/agent/properties");
}
