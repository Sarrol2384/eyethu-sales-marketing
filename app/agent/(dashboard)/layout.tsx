import { redirect } from "next/navigation";
import { getDashboardRole } from "@/lib/auth/dashboard-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

export const dynamic = "force-dynamic";

export default async function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/agent/login");

  const role = await getDashboardRole(supabase, user.id);
  if (role !== "agent") {
    redirect("/admin/properties");
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <AgentSidebar
        userEmail={user.email ?? null}
        userId={user.id}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 px-5 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
