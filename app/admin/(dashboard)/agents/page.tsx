import Link from "next/link";
import Image from "next/image";
import { Plus, User } from "lucide-react";
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
import { fetchAgentRosterForAdmin } from "@/lib/agents/fetch-agent-roster";
import { countLeadsForAgents, type LeadForAgentCount } from "@/lib/leads/agent-attribution";
import {
  buildAgentDefaultsMap,
  sumAgentCommissions,
  type CommissionListing,
} from "@/lib/commission/calculate";
import { formatZAR } from "@/lib/format/currency";
import { formatRelative } from "@/lib/format/date";
import { extractPropertyImagesStoragePath } from "@/lib/supabase/storage-path";
import type { AgentAccountRow } from "@/lib/supabase/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

export const dynamic = "force-dynamic";

export default async function AgentsListPage() {
  const supabase = await createSupabaseServerClient();
  const [{ agents, error: agentsError }, { data: saleListings }, { data: leadRows }] =
    await Promise.all([
      fetchAgentRosterForAdmin(),
      supabase
        .from("properties")
        .select(
          `listing_type, status, price, sold_price, commission_percent, commission_amount,
         assigned_user_id, sourced_by_user_id`,
        )
        .eq("listing_type", "sale"),
      supabase.from("leads").select(
        `id, attributed_agent_user_id,
         properties:property_id ( assigned_user_id, sourced_by_user_id )`,
      ),
    ]);

  const rows = agents;
  const listings = (saleListings ?? []) as CommissionListing[];
  const agentDefaults = buildAgentDefaultsMap(rows);
  const leadCounts = countLeadsForAgents(
    (leadRows ?? []) as unknown as LeadForAgentCount[],
    rows.map((r) => r.user_id),
  );

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

      {agentsError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load agents: {agentsError}
        </div>
      )}

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
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Pipeline (est.)</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
              <TableRow className="bg-muted/30 text-xs text-muted-foreground hover:bg-muted/30">
                <TableCell colSpan={8} className="py-1.5">
                  Share an agent&apos;s link — any enquiry submitted via that
                  link will be attributed to them. Lead counts include assigned,
                  sourced, and referral attribution. Commission totals are for
                  sale listings only.
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const label = row.display_name ?? row.email ?? row.user_id;
                const totals = sumAgentCommissions(
                  listings,
                  row.user_id,
                  agentDefaults,
                );
                return (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">
                      <Link
                        className="flex items-center gap-3 text-primary hover:underline"
                        href={`/admin/agents/${row.user_id}`}
                      >
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-full border bg-muted">
                          {row.photo_url?.trim() ? (
                            <Image
                              src={row.photo_url.trim()}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="36px"
                              unoptimized={
                                extractPropertyImagesStoragePath(
                                  row.photo_url.trim(),
                                ) === null
                              }
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-muted-foreground">
                              <User className="size-4" aria-hidden />
                            </span>
                          )}
                        </span>
                        {label}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {row.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {leadCounts.get(row.user_id) ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZAR(totals.earned)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZAR(totals.pipeline)}
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
                            Edit
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
