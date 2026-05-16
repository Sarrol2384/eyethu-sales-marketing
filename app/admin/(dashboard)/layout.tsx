import { redirect } from "next/navigation";
import { getDashboardRole } from "@/lib/auth/dashboard-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const role = await getDashboardRole(supabase, user.id);
  if (role === "agent") {
    redirect("/agent/properties");
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <Sidebar userEmail={user.email ?? null} />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 px-5 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
