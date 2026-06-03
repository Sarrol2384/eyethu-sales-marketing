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
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string; email?: string | null };
  try {
    supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/admin/login");
    user = data.user;
  } catch {
    throw new Error(
      "Cannot reach Supabase. Check your internet connection and try again.",
    );
  }

  let role: Awaited<ReturnType<typeof getDashboardRole>>;
  try {
    role = await getDashboardRole(supabase, user.id);
  } catch {
    throw new Error(
      "Cannot reach Supabase. Check your internet connection and try again.",
    );
  }
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
