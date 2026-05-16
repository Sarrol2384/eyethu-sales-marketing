import Link from "next/link";
import { AgentForm } from "@/components/admin/AgentForm";

export const dynamic = "force-dynamic";

export default function NewAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add agent</h1>
        <p className="text-sm text-muted-foreground">
          Creates a Supabase Auth user and portal access. Share the email and
          password with the agent — they sign in at{" "}
          <Link className="text-primary underline" href="/agent/login">
            /agent/login
          </Link>
          .
        </p>
      </div>
      <AgentForm />
    </div>
  );
}
