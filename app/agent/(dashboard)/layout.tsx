import { redirect } from "next/navigation";
import { getDashboardRole } from "@/lib/auth/dashboard-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AgentMobileChrome } from "@/components/agent/AgentMobileChrome";
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
      <div className="flex min-w-0 flex-1 flex-col">
        <AgentMobileChrome
          userEmail={user.email ?? null}
          userId={user.id}
        />
        <main className="flex-1 px-5 py-7 pb-28 sm:px-8 md:pb-7">
          {children}
        </main>
      </div>
    </div>
  );
}
