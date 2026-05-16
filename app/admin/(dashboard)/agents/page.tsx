import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteAgentButton } from "@/components/admin/DeleteAgentButton";
import { CopyShareLinkButton } from "@/components/admin/CopyShareLinkButton";
import { formatRelative } from "@/lib/format/date";
import type { AgentAccountRow } from "@/lib/supabase/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function AgentsListPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("agent_accounts")
    .select("user_id, display_name, email, phone, created_at")
    .order("display_name", { ascending: true, nullsFirst: false });

  const rows = (data ?? []) as AgentAccountRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Create accounts for listing agents. Assign listings from each
            property or preview their portal below.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/agents/new">
            <Plus className="size-4" />
            Add agent
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <h2 className="text-lg font-semibold">No agents yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an agent so they can sign in and manage assigned listings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/agents/new">Add your first agent</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
              <TableRow className="bg-muted/30 text-xs text-muted-foreground hover:bg-muted/30">
                <TableCell colSpan={5} className="py-1.5">
                  Share an agent&apos;s link — any enquiry submitted via that link will be attributed to them.
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const label = row.display_name ?? row.email ?? row.user_id;
                return (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatRelative(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <CopyShareLinkButton
                          agentUserId={row.user_id}
                          siteUrl={SITE_URL}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/agents/${row.user_id}`}>
                            View portal
                          </Link>
                        </Button>
                        <DeleteAgentButton userId={row.user_id} label={label} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
